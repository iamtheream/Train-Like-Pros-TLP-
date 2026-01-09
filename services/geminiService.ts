
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTrainingAdvice = async (playerProfile: string) => {
  try {
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
