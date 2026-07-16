import { GoogleGenAI } from '@google/genai';

let aiClient: any = null;
function getAiClient() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }
    aiClient = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, tone, dictionary, command } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    let systemPrompt = `You are an expert editor AI. The following text is a raw voice dictation transcript. 
Your task is to refine it into perfectly polished text based on the user's instructions.

Core Rules for Cleaning:
1. Remove all filler words (e.g., um, uh, este, mmm, o sea).
2. Eliminate unnecessary repetitions.
3. If the speaker corrects themselves mid-sentence (e.g. "let's meet at 7... actually no, 3pm"), output ONLY the final intended thought.
4. Fix grammar and punctuation.
5. CRITICAL: Do NOT translate the text. Keep the language exactly as spoken (e.g., if spoken in Spanish, output in Spanish). Output nothing else but the polished text.

Intent & Formatting:
- If it's a list, use bullet points.
- If it's instructions, format it step-by-step.
`;

    if (tone && tone !== 'natural') {
      systemPrompt += `\nTone Instruction: Apply a "${tone}" tone. Adjust vocabulary and phrasing to match this tone while preserving the core message.`;
    } else {
      systemPrompt += `\nTone Instruction: Maintain the natural intent and tone, whether informal or professional.`;
    }

    if (dictionary && dictionary.length > 0) {
      const dictStr = dictionary.map((d: any) => `${d.word}: ${d.replacement}`).join('\n');
      systemPrompt += `\n\nCustom Dictionary Definitions (Use these specific spellings or definitions when relevant):\n${dictStr}`;
    }

    if (command) {
      systemPrompt += `\n\nExplicit User Command (Override normal processing if needed to fulfill this command):\n"${command}"`;
    }

    systemPrompt += `\n\nReturn only the final polished text containing exactly the intended message. Do not add conversational padding like "Here is the text".`;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: `Raw Transcript:\n"${text}"` }] }
      ]
    });

    res.status(200).json({ polished: response.text?.trim() || '' });
  } catch (error) {
    console.error("Error polishing text:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to polish text' });
  }
}
