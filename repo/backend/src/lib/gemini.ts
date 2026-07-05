import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateResponse(systemPrompt: string, userMessage: string): Promise<string> {
  if (process.env.ENABLE_AI_CHAT !== "true") {
    throw new Error("AI_DISABLED");
  }
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });
  const result = await model.generateContent(userMessage);
  return result.response.text();
}
