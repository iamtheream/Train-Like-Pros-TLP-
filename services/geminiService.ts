import { GoogleGenAI } from "@google/genai";

// Standard Vite way to access defined variables
const API_KEY = process.env.API_KEY || "";

export const getTrainingAdvice = async (playerProfile: string) => {
  if (!API_KEY || API_KEY === "undefined") {
    console.warn("Gemini API Key is missing. Returning default advice.");
    return "I recommend starting with Hitting Fundamentals to build a strong base of confidence at the plate.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional baseball and softball training consultant. Based on this player profile: "${playerProfile}", provide a concise (max 3 sentences) recommendation on which type of lesson they should prioritize (Hitting, Pitching, or Fielding) and one specific drill they could start with.`,
      config: {
        temperature: 0.7,
        topP: 0.8,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I recommend starting with Hitting Fundamentals to build a strong base of confidence at the plate.";
  }
};