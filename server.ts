import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API Client
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route to polish raw dictated text
  app.post('/api/polish', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are an expert editor AI. The following text is a raw voice dictation transcript. 
Your task is to refine it into a perfectly polished, concise text.

Rules:
1. Remove all filler words (e.g., um, uh, like, you know).
2. Eliminate unnecessary repetitions.
3. If the speaker corrects themselves mid-sentence (e.g. "let's meet at 7... actually no, 3pm"), output ONLY the final intended thought ("let's meet at 3pm").
4. Fix grammar and punctuation.
5. DO NOT change the tone or the core meaning.
6. Return only the final polished text containing exactly the intended message. Do not add conversational padding like "Here is the text".

Raw Transcript:
"${text}"`,
      });

      res.json({ polished: response.text?.trim() || '' });
    } catch (error) {
      console.error("Error polishing text:", error);
      res.status(500).json({ error: 'Failed to polish text' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For single page applications:
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
