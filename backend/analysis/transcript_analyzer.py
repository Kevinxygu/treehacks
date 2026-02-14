"""
Transcript analyzer for detecting early signs of cognitive decline.

Analyzes call transcripts from Zingage for linguistic markers including:
- Reduced lexical diversity (type-token ratio)
- Word-finding difficulties (anomia)
- Speech disfluency (fillers, false starts, repetitions)
- Pronoun overuse vs specific nouns
- Repetition of stories/phrases across sessions
- Pause patterns
"""

import re
import math
from collections import Counter
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from datetime import datetime


# --- Constants ---

FILLER_WORDS = {
    "um", "uh", "er", "ah", "like", "you know", "i mean",
    "sort of", "kind of", "basically", "actually", "well",
    "so", "right", "okay", "hmm", "hm", "mm",
}

# Single-word fillers for tokenized matching
SINGLE_FILLERS = {w for w in FILLER_WORDS if " " not in w}

# Multi-word fillers matched via regex on raw text
MULTI_FILLERS = [w for w in FILLER_WORDS if " " in w]

HEDGE_PHRASES = [
    "i think", "i guess", "maybe", "perhaps", "i don't know",
    "i'm not sure", "what's it called", "what do you call it",
    "that thing", "the thing", "the place", "you know the",
    "whatchamacallit", "thingamajig", "whatnot",
]

PERSONAL_PRONOUNS = {
    "i", "me", "my", "mine", "myself",
    "you", "your", "yours", "yourself",
    "he", "him", "his", "himself",
    "she", "her", "hers", "herself",
    "it", "its", "itself",
    "we", "us", "our", "ours", "ourselves",
    "they", "them", "their", "theirs", "themselves",
}

GENERIC_PRONOUNS = {"it", "this", "that", "these", "those", "something", "thing", "stuff"}

# Patterns indicating pauses in transcripts
PAUSE_PATTERNS = [
    r"\.\.\.",           # ellipsis
    r"\[pause\]",        # explicit pause marker
    r"\[long pause\]",
    r"\[silence\]",
    r"\.{4,}",           # extended dots
    r"\(pause\)",
    r"—{2,}",            # long dashes
]

FALSE_START_PATTERNS = [
    r"\b(\w+)\s+--\s+\1",                   # "I was -- I was"
    r"\b(i|he|she|we|they)\s+\w+\s+--\s+",  # "I went -- actually"
    r"\b(\w+)\s*,\s*\1\b",                   # repeated word with comma: "the, the"
]

# Thresholds for flagging (based on literature)
THRESHOLDS = {
    "ttr_low": 0.40,              # type-token ratio below this is concerning
    "filler_rate_high": 0.08,     # fillers per word above 8% is elevated
    "pause_rate_high": 0.03,      # pauses per word above 3% is elevated
    "pronoun_ratio_high": 0.25,   # pronoun-to-word ratio above 25%
    "generic_pronoun_high": 0.10, # generic pronoun ratio above 10%
    "repetition_similarity": 0.7, # sentence similarity threshold for repetition
    "hedge_rate_high": 0.02,      # hedge phrases per word above 2%
}


@dataclass
class CognitiveMarker:
    """A single detected cognitive decline marker."""
    category: str          # e.g. "lexical_diversity", "anomia", "disfluency"
    marker: str            # specific marker name
    value: float           # measured value
    threshold: float       # threshold for concern
    flagged: bool          # whether this value crosses the threshold
    severity: str          # "normal", "mild", "moderate", "elevated"
    evidence: list = field(default_factory=list)  # supporting transcript excerpts


@dataclass
class TranscriptAnalysis:
    """Complete analysis result for a single transcript."""
    session_id: str
    session_date: str
    total_words: int
    unique_words: int
    total_sentences: int
    markers: list          # list of CognitiveMarker
    risk_score: float      # 0-100 composite score
    summary: str           # human-readable summary
    flagged_excerpts: list  # transcript segments with concerns
    raw_metrics: dict      # all computed metrics


@dataclass
class LongitudinalAnalysis:
    """Analysis comparing multiple sessions over time."""
    sessions: list           # list of TranscriptAnalysis
    trend_direction: str     # "stable", "improving", "declining"
    trend_metrics: dict      # metric trends over time
    alerts: list             # significant changes to flag
    summary: str


def _tokenize(text: str) -> list[str]:
    """Simple word tokenizer. Lowercases and splits on non-alpha."""
    return re.findall(r"[a-z]+(?:'[a-z]+)?", text.lower())


def _split_sentences(text: str) -> list[str]:
    """Split text into sentences."""
    sentences = re.split(r'[.!?]+', text)
    return [s.strip() for s in sentences if s.strip() and len(s.strip().split()) > 2]


def _ngrams(tokens: list[str], n: int) -> list[tuple]:
    """Generate n-grams from a token list."""
    return [tuple(tokens[i:i+n]) for i in range(len(tokens) - n + 1)]


class TranscriptAnalyzer:
    """
    Analyzes call transcripts for early signs of cognitive decline.

    Usage:
        analyzer = TranscriptAnalyzer()

        # Single session analysis
        result = analyzer.analyze(transcript_text, session_id="2024-02-14-call-1")

        # Multi-session longitudinal analysis
        longitudinal = analyzer.analyze_longitudinal([
            {"text": transcript1, "session_id": "call-1", "date": "2024-02-01"},
            {"text": transcript2, "session_id": "call-2", "date": "2024-02-05"},
            {"text": transcript3, "session_id": "call-3", "date": "2024-02-10"},
        ])
    """

    def __init__(self, thresholds: dict | None = None):
        self.thresholds = {**THRESHOLDS, **(thresholds or {})}

    # ------------------------------------------------------------------ #
    #  PUBLIC API                                                         #
    # ------------------------------------------------------------------ #

    def analyze(
        self,
        transcript: str,
        session_id: str = "",
        session_date: str = "",
    ) -> TranscriptAnalysis:
        """Analyze a single transcript for cognitive decline markers."""
        if not session_date:
            session_date = datetime.now().strftime("%Y-%m-%d")
        if not session_id:
            session_id = f"session-{session_date}"

        text_lower = transcript.lower()
        tokens = _tokenize(transcript)
        sentences = _split_sentences(transcript)

        if not tokens:
            return TranscriptAnalysis(
                session_id=session_id,
                session_date=session_date,
                total_words=0,
                unique_words=0,
                total_sentences=0,
                markers=[],
                risk_score=0.0,
                summary="Transcript is empty or contains no analyzable words.",
                flagged_excerpts=[],
                raw_metrics={},
            )

        markers: list[CognitiveMarker] = []

        # Run all analyses
        lex_metrics, lex_markers = self._analyze_lexical_diversity(tokens)
        markers.extend(lex_markers)

        anomia_metrics, anomia_markers = self._analyze_anomia(text_lower, tokens, sentences)
        markers.extend(anomia_markers)

        disfluency_metrics, dis_markers = self._analyze_disfluency(text_lower, tokens, sentences)
        markers.extend(dis_markers)

        pronoun_metrics, pronoun_markers = self._analyze_pronoun_usage(tokens)
        markers.extend(pronoun_markers)

        pause_metrics, pause_markers = self._analyze_pauses(transcript, tokens)
        markers.extend(pause_markers)

        repetition_metrics, rep_markers = self._analyze_within_session_repetition(sentences)
        markers.extend(rep_markers)

        # Aggregate all raw metrics
        raw_metrics = {
            **lex_metrics,
            **anomia_metrics,
            **disfluency_metrics,
            **pronoun_metrics,
            **pause_metrics,
            **repetition_metrics,
        }

        # Compute composite risk score
        risk_score = self._compute_risk_score(markers)

        # Collect flagged excerpts
        flagged_excerpts = []
        for m in markers:
            if m.flagged:
                flagged_excerpts.extend(m.evidence)

        summary = self._generate_summary(markers, risk_score)

        return TranscriptAnalysis(
            session_id=session_id,
            session_date=session_date,
            total_words=len(tokens),
            unique_words=len(set(tokens)),
            total_sentences=len(sentences),
            markers=markers,
            risk_score=risk_score,
            summary=summary,
            flagged_excerpts=flagged_excerpts,
            raw_metrics=raw_metrics,
        )

    def analyze_longitudinal(
        self,
        sessions: list[dict],
    ) -> LongitudinalAnalysis:
        """
        Analyze multiple sessions over time for trends.

        Each session dict should have:
            - "text": the transcript string
            - "session_id": unique identifier
            - "date": date string (YYYY-MM-DD)
        """
        analyses = []
        for s in sessions:
            result = self.analyze(
                transcript=s["text"],
                session_id=s.get("session_id", ""),
                session_date=s.get("date", ""),
            )
            analyses.append(result)

        # Sort by date
        analyses.sort(key=lambda a: a.session_date)

        # Compute trends for key metrics
        trend_metrics = self._compute_trends(analyses)
        alerts = self._detect_alerts(analyses, trend_metrics)

        # Cross-session repetition detection
        cross_rep_alerts = self._detect_cross_session_repetition(sessions)
        alerts.extend(cross_rep_alerts)

        trend_direction = self._determine_trend_direction(trend_metrics)
        summary = self._generate_longitudinal_summary(analyses, trend_direction, alerts)

        return LongitudinalAnalysis(
            sessions=analyses,
            trend_direction=trend_direction,
            trend_metrics=trend_metrics,
            alerts=alerts,
            summary=summary,
        )

    # ------------------------------------------------------------------ #
    #  LEXICAL DIVERSITY                                                  #
    # ------------------------------------------------------------------ #

    def _analyze_lexical_diversity(self, tokens: list[str]) -> tuple[dict, list[CognitiveMarker]]:
        """Compute type-token ratio and related metrics."""
        total = len(tokens)
        unique = len(set(tokens))
        ttr = unique / total if total > 0 else 0

        # Moving Average TTR (MATTR) - more robust for varying text lengths
        # Compute TTR over sliding windows of 50 words
        window = min(50, total)
        if total >= window:
            window_ttrs = []
            for i in range(total - window + 1):
                w_tokens = tokens[i:i + window]
                w_ttr = len(set(w_tokens)) / len(w_tokens)
                window_ttrs.append(w_ttr)
            mattr = sum(window_ttrs) / len(window_ttrs)
        else:
            mattr = ttr

        # Hapax legomena ratio (words appearing only once)
        freq = Counter(tokens)
        hapax = sum(1 for count in freq.values() if count == 1)
        hapax_ratio = hapax / total if total > 0 else 0

        flagged = ttr < self.thresholds["ttr_low"]
        severity = self._severity_from_ratio(ttr, self.thresholds["ttr_low"], inverted=True)

        marker = CognitiveMarker(
            category="lexical_diversity",
            marker="type_token_ratio",
            value=round(ttr, 4),
            threshold=self.thresholds["ttr_low"],
            flagged=flagged,
            severity=severity,
            evidence=[f"TTR={ttr:.3f} (unique={unique}, total={total})"],
        )

        metrics = {
            "ttr": round(ttr, 4),
            "mattr": round(mattr, 4),
            "unique_words": unique,
            "total_words": total,
            "hapax_legomena": hapax,
            "hapax_ratio": round(hapax_ratio, 4),
        }

        return metrics, [marker]

    # ------------------------------------------------------------------ #
    #  ANOMIA (WORD-FINDING DIFFICULTIES)                                 #
    # ------------------------------------------------------------------ #

    def _analyze_anomia(
        self, text_lower: str, tokens: list[str], sentences: list[str]
    ) -> tuple[dict, list[CognitiveMarker]]:
        """Detect word-finding difficulties through hedge phrases and tip-of-tongue markers."""
        total = len(tokens)
        markers = []

        # Count hedge/anomia phrases
        hedge_count = 0
        hedge_evidence = []
        for phrase in HEDGE_PHRASES:
            occurrences = len(re.findall(r'\b' + re.escape(phrase) + r'\b', text_lower))
            if occurrences > 0:
                hedge_count += occurrences
                # Find surrounding context for evidence
                for match in re.finditer(r'\b' + re.escape(phrase) + r'\b', text_lower):
                    start = max(0, match.start() - 40)
                    end = min(len(text_lower), match.end() + 40)
                    excerpt = "..." + text_lower[start:end] + "..."
                    hedge_evidence.append(excerpt)

        hedge_rate = hedge_count / total if total > 0 else 0
        flagged = hedge_rate > self.thresholds["hedge_rate_high"]
        severity = self._severity_from_ratio(hedge_rate, self.thresholds["hedge_rate_high"])

        markers.append(CognitiveMarker(
            category="anomia",
            marker="hedge_phrase_rate",
            value=round(hedge_rate, 4),
            threshold=self.thresholds["hedge_rate_high"],
            flagged=flagged,
            severity=severity,
            evidence=hedge_evidence[:5],  # limit to 5 examples
        ))

        # Detect incomplete sentences / trailing off
        trailing_count = 0
        trailing_evidence = []
        for sent in sentences:
            stripped = sent.strip()
            if stripped.endswith("...") or stripped.endswith("--") or stripped.endswith("—"):
                trailing_count += 1
                trailing_evidence.append(stripped)

        metrics = {
            "hedge_phrase_count": hedge_count,
            "hedge_phrase_rate": round(hedge_rate, 4),
            "trailing_sentences": trailing_count,
            "anomia_indicators": hedge_count + trailing_count,
        }

        return metrics, markers

    # ------------------------------------------------------------------ #
    #  SPEECH DISFLUENCY                                                  #
    # ------------------------------------------------------------------ #

    def _analyze_disfluency(
        self, text_lower: str, tokens: list[str], sentences: list[str]
    ) -> tuple[dict, list[CognitiveMarker]]:
        """Detect fillers, false starts, and verbal disfluency."""
        total = len(tokens)
        markers = []

        # Count single-word fillers
        filler_count = sum(1 for t in tokens if t in SINGLE_FILLERS)

        # Count multi-word fillers
        for phrase in MULTI_FILLERS:
            filler_count += len(re.findall(r'\b' + re.escape(phrase) + r'\b', text_lower))

        filler_rate = filler_count / total if total > 0 else 0
        filler_evidence = []

        # Find filler examples in context
        for filler in SINGLE_FILLERS:
            for match in re.finditer(r'\b' + re.escape(filler) + r'\b', text_lower):
                start = max(0, match.start() - 30)
                end = min(len(text_lower), match.end() + 30)
                filler_evidence.append("..." + text_lower[start:end] + "...")
                if len(filler_evidence) >= 5:
                    break
            if len(filler_evidence) >= 5:
                break

        flagged = filler_rate > self.thresholds["filler_rate_high"]
        severity = self._severity_from_ratio(filler_rate, self.thresholds["filler_rate_high"])

        markers.append(CognitiveMarker(
            category="disfluency",
            marker="filler_word_rate",
            value=round(filler_rate, 4),
            threshold=self.thresholds["filler_rate_high"],
            flagged=flagged,
            severity=severity,
            evidence=filler_evidence[:5],
        ))

        # Detect false starts
        false_start_count = 0
        false_start_evidence = []
        for pattern in FALSE_START_PATTERNS:
            for match in re.finditer(pattern, text_lower):
                false_start_count += 1
                start = max(0, match.start() - 20)
                end = min(len(text_lower), match.end() + 20)
                false_start_evidence.append("..." + text_lower[start:end] + "...")

        # Detect immediate word repetition ("the the", "I I")
        word_repetitions = 0
        word_rep_evidence = []
        for i in range(len(tokens) - 1):
            if tokens[i] == tokens[i + 1] and tokens[i] not in {"ha", "no", "yes", "bye"}:
                word_repetitions += 1
                # Find in text for context
                pattern = r'\b' + re.escape(tokens[i]) + r'\s+' + re.escape(tokens[i]) + r'\b'
                for match in re.finditer(pattern, text_lower):
                    start = max(0, match.start() - 20)
                    end = min(len(text_lower), match.end() + 20)
                    word_rep_evidence.append("..." + text_lower[start:end] + "...")
                    break

        metrics = {
            "filler_count": filler_count,
            "filler_rate": round(filler_rate, 4),
            "false_starts": false_start_count,
            "immediate_word_repetitions": word_repetitions,
            "total_disfluencies": filler_count + false_start_count + word_repetitions,
        }

        return metrics, markers

    # ------------------------------------------------------------------ #
    #  PRONOUN USAGE                                                      #
    # ------------------------------------------------------------------ #

    def _analyze_pronoun_usage(self, tokens: list[str]) -> tuple[dict, list[CognitiveMarker]]:
        """Analyze overuse of pronouns, especially generic ones."""
        total = len(tokens)
        markers = []

        pronoun_count = sum(1 for t in tokens if t in PERSONAL_PRONOUNS)
        generic_count = sum(1 for t in tokens if t in GENERIC_PRONOUNS)

        pronoun_ratio = pronoun_count / total if total > 0 else 0
        generic_ratio = generic_count / total if total > 0 else 0

        # Pronoun ratio
        flagged_pr = pronoun_ratio > self.thresholds["pronoun_ratio_high"]
        severity_pr = self._severity_from_ratio(pronoun_ratio, self.thresholds["pronoun_ratio_high"])

        markers.append(CognitiveMarker(
            category="pronoun_usage",
            marker="pronoun_ratio",
            value=round(pronoun_ratio, 4),
            threshold=self.thresholds["pronoun_ratio_high"],
            flagged=flagged_pr,
            severity=severity_pr,
            evidence=[f"Pronouns: {pronoun_count}/{total} words ({pronoun_ratio:.1%})"],
        ))

        # Generic pronoun ratio (stronger signal for anomia)
        flagged_gp = generic_ratio > self.thresholds["generic_pronoun_high"]
        severity_gp = self._severity_from_ratio(generic_ratio, self.thresholds["generic_pronoun_high"])

        markers.append(CognitiveMarker(
            category="pronoun_usage",
            marker="generic_pronoun_ratio",
            value=round(generic_ratio, 4),
            threshold=self.thresholds["generic_pronoun_high"],
            flagged=flagged_gp,
            severity=severity_gp,
            evidence=[f"Generic pronouns (it/this/that/thing/stuff): {generic_count}/{total} ({generic_ratio:.1%})"],
        ))

        metrics = {
            "pronoun_count": pronoun_count,
            "pronoun_ratio": round(pronoun_ratio, 4),
            "generic_pronoun_count": generic_count,
            "generic_pronoun_ratio": round(generic_ratio, 4),
        }

        return metrics, markers

    # ------------------------------------------------------------------ #
    #  PAUSE DETECTION                                                    #
    # ------------------------------------------------------------------ #

    def _analyze_pauses(self, transcript: str, tokens: list[str]) -> tuple[dict, list[CognitiveMarker]]:
        """Detect pause markers in transcript text."""
        total = len(tokens)
        markers = []

        pause_count = 0
        pause_evidence = []
        for pattern in PAUSE_PATTERNS:
            for match in re.finditer(pattern, transcript, re.IGNORECASE):
                pause_count += 1
                start = max(0, match.start() - 40)
                end = min(len(transcript), match.end() + 40)
                pause_evidence.append("..." + transcript[start:end] + "...")

        pause_rate = pause_count / total if total > 0 else 0
        flagged = pause_rate > self.thresholds["pause_rate_high"]
        severity = self._severity_from_ratio(pause_rate, self.thresholds["pause_rate_high"])

        markers.append(CognitiveMarker(
            category="pause_patterns",
            marker="pause_rate",
            value=round(pause_rate, 4),
            threshold=self.thresholds["pause_rate_high"],
            flagged=flagged,
            severity=severity,
            evidence=pause_evidence[:5],
        ))

        metrics = {
            "pause_count": pause_count,
            "pause_rate": round(pause_rate, 4),
        }

        return metrics, markers

    # ------------------------------------------------------------------ #
    #  WITHIN-SESSION REPETITION                                          #
    # ------------------------------------------------------------------ #

    def _analyze_within_session_repetition(
        self, sentences: list[str]
    ) -> tuple[dict, list[CognitiveMarker]]:
        """Detect repeated stories or phrases within a single conversation."""
        markers = []
        threshold = self.thresholds["repetition_similarity"]

        repeated_pairs = []
        for i in range(len(sentences)):
            for j in range(i + 2, len(sentences)):  # skip adjacent for natural conversation
                sim = SequenceMatcher(
                    None,
                    sentences[i].lower().split(),
                    sentences[j].lower().split(),
                ).ratio()
                if sim >= threshold:
                    repeated_pairs.append({
                        "sentence_a": sentences[i],
                        "sentence_b": sentences[j],
                        "similarity": round(sim, 3),
                        "positions": (i, j),
                    })

        repetition_count = len(repeated_pairs)
        evidence = [
            f"[{p['similarity']:.0%} similar] \"{p['sentence_a'][:80]}\" <-> \"{p['sentence_b'][:80]}\""
            for p in repeated_pairs[:5]
        ]

        flagged = repetition_count > 0
        severity = "normal"
        if repetition_count >= 3:
            severity = "elevated"
        elif repetition_count >= 2:
            severity = "moderate"
        elif repetition_count >= 1:
            severity = "mild"

        markers.append(CognitiveMarker(
            category="repetition",
            marker="within_session_repetitions",
            value=repetition_count,
            threshold=1,
            flagged=flagged,
            severity=severity,
            evidence=evidence,
        ))

        metrics = {
            "within_session_repetitions": repetition_count,
            "repeated_pairs": repeated_pairs[:10],
        }

        return metrics, markers

    # ------------------------------------------------------------------ #
    #  CROSS-SESSION REPETITION                                           #
    # ------------------------------------------------------------------ #

    def _detect_cross_session_repetition(self, sessions: list[dict]) -> list[dict]:
        """Detect similar stories told across different sessions."""
        alerts = []
        threshold = self.thresholds["repetition_similarity"]

        for i in range(len(sessions)):
            sents_i = _split_sentences(sessions[i]["text"])
            for j in range(i + 1, len(sessions)):
                sents_j = _split_sentences(sessions[j]["text"])

                for si in sents_i:
                    if len(si.split()) < 6:
                        continue
                    for sj in sents_j:
                        if len(sj.split()) < 6:
                            continue
                        sim = SequenceMatcher(
                            None, si.lower().split(), sj.lower().split()
                        ).ratio()
                        if sim >= threshold:
                            alerts.append({
                                "type": "cross_session_repetition",
                                "severity": "moderate" if sim < 0.85 else "elevated",
                                "session_a": sessions[i].get("session_id", f"session-{i}"),
                                "session_b": sessions[j].get("session_id", f"session-{j}"),
                                "sentence_a": si[:120],
                                "sentence_b": sj[:120],
                                "similarity": round(sim, 3),
                                "message": (
                                    f"Similar narrative detected across sessions "
                                    f"({sim:.0%} match): \"{si[:60]}...\" repeated in later session."
                                ),
                            })

        return alerts

    # ------------------------------------------------------------------ #
    #  SCORING & TRENDS                                                   #
    # ------------------------------------------------------------------ #

    def _compute_risk_score(self, markers: list[CognitiveMarker]) -> float:
        """
        Compute a composite risk score (0-100) from individual markers.

        Weights reflect clinical importance from literature:
        - Lexical diversity & anomia are strongest predictors
        - Repetition and disfluency are supporting signals
        """
        weights = {
            "lexical_diversity": 25,
            "anomia": 25,
            "disfluency": 15,
            "pronoun_usage": 10,
            "pause_patterns": 10,
            "repetition": 15,
        }

        score = 0.0
        category_scores: dict[str, list[float]] = {}

        for m in markers:
            severity_val = {"normal": 0.0, "mild": 0.33, "moderate": 0.66, "elevated": 1.0}
            val = severity_val.get(m.severity, 0.0)
            category_scores.setdefault(m.category, []).append(val)

        for category, vals in category_scores.items():
            avg = sum(vals) / len(vals)
            weight = weights.get(category, 10)
            score += avg * weight

        return round(min(score, 100.0), 1)

    def _compute_trends(self, analyses: list[TranscriptAnalysis]) -> dict:
        """Compute metric trends across sessions."""
        key_metrics = ["ttr", "mattr", "filler_rate", "hedge_phrase_rate",
                        "pause_rate", "pronoun_ratio", "generic_pronoun_ratio",
                        "within_session_repetitions"]
        trends = {}
        for metric in key_metrics:
            values = []
            for a in analyses:
                if metric in a.raw_metrics:
                    values.append({
                        "session_id": a.session_id,
                        "date": a.session_date,
                        "value": a.raw_metrics[metric],
                    })
            if values:
                first_val = values[0]["value"]
                last_val = values[-1]["value"]
                change = last_val - first_val
                trends[metric] = {
                    "values": values,
                    "first": first_val,
                    "last": last_val,
                    "change": round(change, 4),
                    "pct_change": round(change / first_val * 100, 1) if first_val != 0 else 0,
                }

        return trends

    def _detect_alerts(
        self, analyses: list[TranscriptAnalysis], trends: dict
    ) -> list[dict]:
        """Generate alerts for significant metric changes."""
        alerts = []

        # TTR declining
        if "ttr" in trends and trends["ttr"]["change"] < -0.05:
            alerts.append({
                "type": "metric_decline",
                "metric": "ttr",
                "severity": "moderate",
                "message": (
                    f"Lexical diversity (TTR) declined by "
                    f"{abs(trends['ttr']['pct_change']):.1f}% across sessions "
                    f"({trends['ttr']['first']:.3f} -> {trends['ttr']['last']:.3f})."
                ),
            })

        # Filler rate increasing
        if "filler_rate" in trends and trends["filler_rate"]["change"] > 0.02:
            alerts.append({
                "type": "metric_increase",
                "metric": "filler_rate",
                "severity": "moderate",
                "message": (
                    f"Filler word rate increased by "
                    f"{trends['filler_rate']['pct_change']:.1f}% across sessions."
                ),
            })

        # Rising risk scores
        risk_scores = [a.risk_score for a in analyses]
        if len(risk_scores) >= 2 and risk_scores[-1] - risk_scores[0] > 10:
            alerts.append({
                "type": "risk_score_increase",
                "severity": "elevated",
                "message": (
                    f"Composite risk score increased from "
                    f"{risk_scores[0]:.1f} to {risk_scores[-1]:.1f} over "
                    f"{len(analyses)} sessions."
                ),
            })

        return alerts

    def _determine_trend_direction(self, trends: dict) -> str:
        """Determine overall trend direction from metric changes."""
        declining_signals = 0
        improving_signals = 0

        if "ttr" in trends:
            if trends["ttr"]["change"] < -0.03:
                declining_signals += 2
            elif trends["ttr"]["change"] > 0.03:
                improving_signals += 2

        if "filler_rate" in trends:
            if trends["filler_rate"]["change"] > 0.02:
                declining_signals += 1
            elif trends["filler_rate"]["change"] < -0.02:
                improving_signals += 1

        if "hedge_phrase_rate" in trends:
            if trends["hedge_phrase_rate"]["change"] > 0.01:
                declining_signals += 1
            elif trends["hedge_phrase_rate"]["change"] < -0.01:
                improving_signals += 1

        if declining_signals > improving_signals:
            return "declining"
        elif improving_signals > declining_signals:
            return "improving"
        return "stable"

    # ------------------------------------------------------------------ #
    #  SUMMARIES                                                          #
    # ------------------------------------------------------------------ #

    def _generate_summary(self, markers: list[CognitiveMarker], risk_score: float) -> str:
        """Generate a human-readable summary of the analysis."""
        flagged = [m for m in markers if m.flagged]

        if not flagged:
            return (
                f"No significant cognitive decline markers detected in this session. "
                f"Risk score: {risk_score:.1f}/100."
            )

        parts = [f"Risk score: {risk_score:.1f}/100. Detected {len(flagged)} area(s) of concern:"]

        category_labels = {
            "lexical_diversity": "Reduced vocabulary diversity",
            "anomia": "Word-finding difficulties",
            "disfluency": "Speech disfluency (fillers/false starts)",
            "pronoun_usage": "Elevated pronoun usage",
            "pause_patterns": "Increased pausing",
            "repetition": "Repetitive statements",
        }

        seen_categories = set()
        for m in flagged:
            if m.category not in seen_categories:
                label = category_labels.get(m.category, m.category)
                parts.append(f"  - {label} ({m.severity})")
                seen_categories.add(m.category)

        return "\n".join(parts)

    def _generate_longitudinal_summary(
        self,
        analyses: list[TranscriptAnalysis],
        trend_direction: str,
        alerts: list[dict],
    ) -> str:
        """Generate summary for longitudinal analysis."""
        parts = [
            f"Longitudinal analysis across {len(analyses)} sessions.",
            f"Overall trend: {trend_direction}.",
        ]

        risk_scores = [a.risk_score for a in analyses]
        parts.append(
            f"Risk score range: {min(risk_scores):.1f} - {max(risk_scores):.1f} "
            f"(latest: {risk_scores[-1]:.1f})."
        )

        if alerts:
            parts.append(f"\n{len(alerts)} alert(s):")
            for alert in alerts:
                parts.append(f"  - [{alert['severity'].upper()}] {alert['message']}")

        return "\n".join(parts)

    # ------------------------------------------------------------------ #
    #  HELPERS                                                            #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _severity_from_ratio(value: float, threshold: float, inverted: bool = False) -> str:
        """
        Determine severity level.

        For normal metrics (higher = worse): value > threshold means flagged.
        For inverted metrics (lower = worse, like TTR): value < threshold means flagged.
        """
        if inverted:
            if value >= threshold * 1.2:
                return "normal"
            elif value >= threshold:
                return "mild"
            elif value >= threshold * 0.8:
                return "moderate"
            else:
                return "elevated"
        else:
            if value <= threshold * 0.5:
                return "normal"
            elif value <= threshold:
                return "mild"
            elif value <= threshold * 1.5:
                return "moderate"
            else:
                return "elevated"


def analyze_transcript(transcript: str, session_id: str = "", session_date: str = "") -> dict:
    """
    Convenience function for analyzing a single transcript.
    Returns a serializable dict.
    """
    analyzer = TranscriptAnalyzer()
    result = analyzer.analyze(transcript, session_id, session_date)
    return _analysis_to_dict(result)


def analyze_sessions(sessions: list[dict]) -> dict:
    """
    Convenience function for longitudinal analysis.
    Each session: {"text": str, "session_id": str, "date": str}
    Returns a serializable dict.
    """
    analyzer = TranscriptAnalyzer()
    result = analyzer.analyze_longitudinal(sessions)
    return _longitudinal_to_dict(result)


def _analysis_to_dict(a: TranscriptAnalysis) -> dict:
    """Convert TranscriptAnalysis to a JSON-serializable dict."""
    return {
        "session_id": a.session_id,
        "session_date": a.session_date,
        "total_words": a.total_words,
        "unique_words": a.unique_words,
        "total_sentences": a.total_sentences,
        "risk_score": a.risk_score,
        "summary": a.summary,
        "flagged_excerpts": a.flagged_excerpts,
        "markers": [
            {
                "category": m.category,
                "marker": m.marker,
                "value": m.value,
                "threshold": m.threshold,
                "flagged": m.flagged,
                "severity": m.severity,
                "evidence": m.evidence,
            }
            for m in a.markers
        ],
        "raw_metrics": a.raw_metrics,
    }


def _longitudinal_to_dict(l: LongitudinalAnalysis) -> dict:
    """Convert LongitudinalAnalysis to a JSON-serializable dict."""
    return {
        "trend_direction": l.trend_direction,
        "trend_metrics": l.trend_metrics,
        "alerts": l.alerts,
        "summary": l.summary,
        "sessions": [_analysis_to_dict(s) for s in l.sessions],
    }
