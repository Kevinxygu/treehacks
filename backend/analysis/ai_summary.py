"""
Claude API integration for generating human-readable analysis summaries
and intervention recommendations from rule-based cognitive decline scores.
"""

import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """\
You are a clinical cognitive health assistant embedded in an elderly care platform. \
You receive structured analysis data from a rule-based speech analysis system that \
detects early markers of cognitive decline from voice call transcripts.

Your job is to:
1. Interpret the rule-based scores in plain, empathetic language suitable for a family caretaker.
2. Highlight which markers are concerning and explain what they mean in simple terms.
3. Provide actionable interventions and daily tips to help slow or prevent cognitive decline.

Guidelines:
- Be warm, supportive, and non-alarmist. These are screening signals, not diagnoses.
- Speak to a caretaker audience (e.g. adult children caring for aging parents).
- Ground your explanations in the actual data (reference specific metrics).
- Separate your response into clear sections.
- For interventions, prioritize evidence-based lifestyle recommendations \
  (physical activity, social engagement, cognitive exercises, sleep hygiene, nutrition).
- If risk is low, still offer general wellness tips.
- Never claim to provide a medical diagnosis.
"""


def generate_summary(analysis_result: dict) -> dict:
    """
    Take the rule-based analysis output and generate a Claude-powered
    summary with interventions.

    Args:
        analysis_result: Output from analyze_transcript() or a single
                         session from analyze_sessions().

    Returns:
        dict with "summary", "interventions", and "raw_analysis" keys.
    """
    user_message = _build_prompt(analysis_result)

    response = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    ai_text = response.content[0].text

    return {
        "ai_summary": ai_text,
        "risk_score": analysis_result.get("risk_score", 0),
        "rule_based_summary": analysis_result.get("summary", ""),
        "session_id": analysis_result.get("session_id", ""),
        "session_date": analysis_result.get("session_date", ""),
    }


def generate_longitudinal_summary(longitudinal_result: dict) -> dict:
    """
    Generate a Claude-powered summary for multi-session longitudinal analysis.

    Args:
        longitudinal_result: Output from analyze_sessions().

    Returns:
        dict with AI summary, trend interpretation, and interventions.
    """
    user_message = _build_longitudinal_prompt(longitudinal_result)

    response = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    ai_text = response.content[0].text

    return {
        "ai_summary": ai_text,
        "trend_direction": longitudinal_result.get("trend_direction", ""),
        "num_sessions": len(longitudinal_result.get("sessions", [])),
        "alerts": longitudinal_result.get("alerts", []),
        "rule_based_summary": longitudinal_result.get("summary", ""),
    }


# --- Prompt builders ---

def _build_prompt(analysis: dict) -> str:
    """Build the user prompt for single-session analysis."""
    markers_summary = []
    for m in analysis.get("markers", []):
        markers_summary.append(
            f"- {m['category']}/{m['marker']}: value={m['value']}, "
            f"threshold={m['threshold']}, flagged={m['flagged']}, "
            f"severity={m['severity']}"
        )

    flagged_excerpts = analysis.get("flagged_excerpts", [])
    excerpts_text = "\n".join(f"  - {e}" for e in flagged_excerpts[:8])

    metrics = analysis.get("raw_metrics", {})
    key_metrics = {
        "total_words": metrics.get("total_words"),
        "unique_words": metrics.get("unique_words"),
        "type_token_ratio": metrics.get("ttr"),
        "filler_rate": metrics.get("filler_rate"),
        "hedge_phrase_rate": metrics.get("hedge_phrase_rate"),
        "pause_rate": metrics.get("pause_rate"),
        "pronoun_ratio": metrics.get("pronoun_ratio"),
        "generic_pronoun_ratio": metrics.get("generic_pronoun_ratio"),
        "within_session_repetitions": metrics.get("within_session_repetitions"),
    }

    return f"""Here is the cognitive decline screening analysis for a voice call transcript.

**Session:** {analysis.get('session_id', 'N/A')} | Date: {analysis.get('session_date', 'N/A')}
**Risk Score:** {analysis.get('risk_score', 0)}/100
**Rule-Based Summary:** {analysis.get('summary', 'N/A')}

**Marker Breakdown:**
{chr(10).join(markers_summary)}

**Key Metrics:**
{json.dumps(key_metrics, indent=2)}

**Flagged Transcript Excerpts:**
{excerpts_text if excerpts_text else '  (none)'}

Please provide:
1. **Overview** - A 2-3 sentence plain-language interpretation of these results for a family caretaker.
2. **Areas of Concern** - Explain each flagged marker in simple terms. What does it look like in conversation? Why does it matter?
3. **Positive Signs** - Note any metrics that look healthy or normal.
4. **Recommended Interventions** - 3-5 specific, actionable steps the caretaker or elderly person can take this week to support cognitive health. Include a mix of physical, social, and cognitive activities.
5. **Daily Tips** - 2-3 small daily habits that can help.
"""


def _build_longitudinal_prompt(result: dict) -> str:
    """Build the user prompt for longitudinal analysis."""
    sessions_summary = []
    for s in result.get("sessions", []):
        sessions_summary.append(
            f"- {s['session_id']} ({s['session_date']}): "
            f"risk={s['risk_score']}, words={s['total_words']}, "
            f"TTR={s['raw_metrics'].get('ttr', 'N/A')}, "
            f"fillers={s['raw_metrics'].get('filler_rate', 'N/A')}, "
            f"pauses={s['raw_metrics'].get('pause_rate', 'N/A')}"
        )

    alerts_text = ""
    for a in result.get("alerts", []):
        alerts_text += f"  - [{a.get('severity', '')}] {a.get('message', '')}\n"

    trend_metrics = result.get("trend_metrics", {})
    trend_summary = []
    for metric, data in trend_metrics.items():
        trend_summary.append(
            f"- {metric}: {data['first']} -> {data['last']} "
            f"(change: {data['change']:+.4f}, {data['pct_change']:+.1f}%)"
        )

    return f"""Here is a longitudinal cognitive decline screening analysis across multiple voice call sessions.

**Overall Trend:** {result.get('trend_direction', 'N/A')}
**Number of Sessions:** {len(result.get('sessions', []))}

**Per-Session Summary:**
{chr(10).join(sessions_summary)}

**Metric Trends:**
{chr(10).join(trend_summary)}

**Alerts:**
{alerts_text if alerts_text else '  (none)'}

**Rule-Based Summary:** {result.get('summary', 'N/A')}

Please provide:
1. **Trend Overview** - A 2-3 sentence plain-language interpretation of how things are changing over time.
2. **Key Changes** - Highlight the most significant shifts between sessions. Are things getting better, worse, or staying stable?
3. **Cross-Session Patterns** - Note any repeated stories, increasing confusion, or other patterns across calls.
4. **Recommended Interventions** - 4-6 specific, evidence-based steps prioritized by urgency. Include both immediate actions and longer-term lifestyle adjustments.
5. **When to Seek Professional Help** - Clear guidance on what changes would warrant a doctor visit.
6. **Weekly Plan** - A simple 7-day plan with one cognitive, physical, and social activity per day.
"""
