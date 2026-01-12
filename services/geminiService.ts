import { GoogleGenAI } from "@google/genai";

export const getTrainingAdvice = async (playerProfile: string) => {
  // Use the API key exclusively from the environment variable process.env.API_KEY
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "null") {
    console.warn("Gemini API Key is missing. Using fallback advice.");
    return "I recommend starting with Hitting Fundamentals to build a strong base of confidence at the plate.";
  }

  try {
    // Initializing the GenAI client with named parameters as specified in guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional baseball and softball training consultant. Based on this player profile: "${playerProfile}", provide a concise (max 3 sentences) recommendation on which type of lesson they should prioritize (Hitting, Pitching, or Fielding) and one specific drill they could start with.`,
      config: {
        temperature: 0.7,
        topP: 0.8,
      },
    });
    // Correctly extracting the text from GenerateContentResponse using the .text property
    return response.text || "I recommend focusing on core hitting mechanics this week.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I recommend starting with Hitting Fundamentals to build a strong base of confidence at the plate.";
  }
};