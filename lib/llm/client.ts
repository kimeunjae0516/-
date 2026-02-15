import OpenAI from "openai";

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export const llmClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function callLlmJson(systemPrompt: string, userPrompt: string) {
  if (!llmClient) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const response = await llmClient.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  return response.choices[0]?.message?.content ?? "";
}
