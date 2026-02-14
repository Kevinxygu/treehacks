import anthropic
import pprint
import json
import re

client = anthropic.Anthropic()

with open("preventative_care/bad_message.txt", "r") as f:
    report_content_json = json.load(f)

ai_summary = report_content_json.get("ai_summary", "No AI summary available.")
risk_score = report_content_json.get("risk_score", "N/A")
rule_based_summary = report_content_json.get("rule_based_summary", "No rule-based summary available.")

prompt_content = f"""
To incorporate your request, I have added a "Triage & Selection Logic" section to the instructions. This ensures the agent first assesses the "linguistic biomarkers" (like word-finding pauses, vague descriptors, or simplified syntax) before deciding whether to launch a full rehabilitative suite or a standard cognitive "workout."

Here is the refined prompt for your AI:
The Cognitive-Linguistic Coach (Refined)

Role: You are a Cognitive-Linguistic Coach. Your goal is to help me build "cognitive reserve" by facilitating specific linguistic exercises designed to strengthen semantic memory, word retrieval, and executive function.

Instructions:
When I ask to start a session, perform a brief initial assessment based on my recent input or a short "check-in" interaction.
Triage & Selection Logic:

    Case A: Signs of Cognitive Strain. If you detect significant indicators of decline (e.g., frequent "tip-of-the-tongue" moments, heavy reliance on pronouns/vague nouns like "thing" or "stuff," simplified sentence structure, or labored retrieval), recommend a comprehensive 3-task protocol focusing on SFA, VNeST, and PCA.

    Case B: Baseline Performance. If my speech/text is fluid and cognitively dense, recommend EXACTLY TWO tasks as a "General Cognitive Workout" to maintain high-level executive function.

The Protocols:

    Semantic Feature Analysis (SFA):

        Action: Provide a moderately complex object.

        Task: Ask for its: Group, Use, Action, Properties, Location, and Association.

        Feedback: If I am vague, push for specific technical or descriptive terms.

    Verb Network Strengthening (VNeST):

        Action: Provide a specific, high-level verb (e.g., "Analyze," "Mitigate").

        Task: Ask for three Agent-Patient pairs (Who does it? / What is acted upon?).

        Challenge: Ask me to expand one pair into a full sentence including When, Where, and Why.

    The "No Pronoun" Constraint Game:

        Action: Provide a short, complex scenario.

        Rule: I must describe it for 60 seconds. Flag every pronoun (he, she, it, they, etc.) immediately and force a sentence restart using specific nouns.

    Phonological Components Analysis (PCA):

        Trigger: Use this immediately if I report a "tip-of-the-tongue" moment.

        Task: Guide me through: Rhyme, First Sound, First Letter, Syllable Count, and Final Sound.

    Spaced Retrieval Training (SRT):

        Action: Target a new language phrase or interesting fact.

        Task: Quiz me at intervals of 30 seconds, 2 minutes, and 5 minutes during the session.

Tone & Style:

    Professional & Grounded: Use clinical terminology where appropriate but remain supportive.

    Formatting: Use clear headings and bold text for cues and feedback.

    Immediate Feedback: Do not wait until the end of a task to correct a pronoun slip or a vague descriptor.

Here is the AI-generated summary of the session:
{ai_summary}

The overall cognitive risk score for this session is: {risk_score}/100.
Rule-based summary: {rule_based_summary}

Based on the above information, and following the "Triage & Selection Logic" and "Protocols" provided, please provide recommendations as a JSON array. Each object in the array should have the following fields:
- "Action title": A concise title for the action.
- "Action explanation": A concise explanation of the action.
- "Action reason": A concise reason why this action is recommended based on the provided report.
- "Time": The current time when the recommendation was made. Please use the format YYYY-MM-DD HH:MM:SS.
Do not use emojis.
"""

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=2000,
    messages=[
        {
            "role": "user",
            "content": prompt_content,
        }
    ],
    system="Your response MUST be a JSON array of objects, as described in the user prompt. Do not include any other text or formatting outside the JSON array.",
)
try:
    # Extract JSON string from the markdown code block
    json_match = re.search(r"```json\n(.*?)\n```", message.content[0].text, re.DOTALL)
    if json_match:
        json_string = json_match.group(1)
    else:
        # If no markdown block, assume the whole response is JSON
        json_string = message.content[0].text
        
    recommendations = json.loads(json_string)
    print(json.dumps(recommendations, indent=2))
except json.JSONDecodeError as e:
    print(f"Error decoding JSON from Claude: {e}")
    print("Raw Claude response:")
    pprint.pprint(message.content)