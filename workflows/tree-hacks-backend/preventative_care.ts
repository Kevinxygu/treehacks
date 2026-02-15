import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, 
});

/**
 * Interface for the structured recommendation
 */
export interface Recommendation {
  "Action title": string;
  "Action explanation": string;
  "Action reason": string;
  "Time": string;
}

/**
 * Generates recommendations. 
 * Note: While the internal API call is async, this is exported 
 * for use in your application's data flow.
 */
export const getPreventativeCareRecommendations = async (
  aiSummary: string
): Promise<Recommendation[] | any> => {
  
  const currentTime = new Date().toISOString().replace('T', ' ').split('.')[0];

  const prompt = `
[... Your Detailed Prompt Logic Here ...]

Here is the AI-generated summary of the session:
${aiSummary}

Output the recommendations as a JSON array with these fields:
- "Action title"
- "Action explanation"
- "Action reason"
- "Time": "${currentTime}"
`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2000,
      system: "Your response MUST be a raw JSON array. No markdown, no conversational filler.",
      messages: [{ role: "user", content: prompt }],
    });

    // Extract the text content safely
    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    // Clean potential Markdown formatting if Claude adds it despite instructions
    const cleanJson = content.replace(/```json|```/g, "").trim();
    
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Failed to fetch or parse AI recommendations:", error);
    // Return the error object so the UI can handle it
    return {
      error: "AI_PARSE_ERROR",
      message: error instanceof Error ? error.message : String(error)
    };
  }
};