import anthropic
import pprint
import json
import re
from datetime import datetime

client = anthropic.Anthropic()

def get_preventative_care_recommendations(ai_summary: str):
    """
    Generates preventative care recommendations based on AI and rule-based summaries.

    Args:
        ai_summary (str): AI-generated summary of the session.
        risk_score (str): Overall cognitive risk score for the session.
        rule_based_summary (str): Rule-based summary of the session.

    Returns:
        dict: A dictionary containing preventative care recommendations or an error message.
    """
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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

Based on the above information, and following the "Triage & Selection Logic" and "Protocols" provided, please provide recommendations as a JSON array. Each object in the array should have the following fields:
- "Action title": A concise title for the action.
- "Action explanation": A concise explanation of the action.
- "Action reason": A concise reason why this action is recommended based on the provided report.
- "Time": "{current_time}"
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
        json_match = re.search(r"```json\n(.*?)\n```", message.content[0].text, re.DOTALL)
        if json_match:
            json_string = json_match.group(1)
        else:
            json_string = message.content[0].text
            
        recommendations = json.loads(json_string)
        return recommendations
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from Claude: {e}")
        print("Raw Claude response:")
        pprint.pprint(message.content)
        return {"error": "Failed to decode JSON from AI response", "raw_response": message.content[0].text}

