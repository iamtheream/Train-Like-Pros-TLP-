import { GoogleGenAI } from "@google/genai";

// Access the API key defined in vite.config.ts
const getApiKey = () => {
  try {
    const key = process.env.API_KEY;
    if (!key || key === "undefined" || key === "null") return "";
    return key;
  } catch {
    return "";
  }
};

export const getTrainingAdvice = async (playerProfile: string) => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Using fallback advice.");
    return "I recommend starting with Hitting Fundamentals to build a strong base of confidence at the plate.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional baseball and softball training consultant. Based on this player profile: "${playerProfile}", provide a concise (max 3 sentences) recommendation on which type of lesson they should prioritize (Hitting, Pitching, or Fielding) and one specific drill they could start with.`,
      config: {
        temperature: 0.7,
        topP: 0.8,
      },
    });
    return response.text || "I recommend focusing on core hitting mechanics this week.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I recommend starting with Hitting Fundamentals to build a strong base of confidence at the plate.";
  }
};