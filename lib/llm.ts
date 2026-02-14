import OpenAI from "openai";
import { AnalysisResponse } from "@/types/analysis";

export const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const SYSTEM_PROMPT = `너는 커뮤니케이션 코치다. 심리/의도 단정하지 마라. '처럼 들릴 수 있어요' 표현만 사용. 간결하게. 의료/상담이 아니다. 출력은 지정된 JSON 스키마를 엄격히 따른다. 출력은 JSON만.`;

const fallback: AnalysisResponse = {
  summary: "입력 내용을 바탕으로 오해 가능 지점을 요약하기 어려웠어요. 핵심 문장을 2~3개로 줄여 다시 시도해 주세요.",
  toneLabel: "중립",
  toneScore: 50,
  misunderstandings: [{ quote: "", reason: "문맥이 부족해 판단이 어려웠습니다." }],
  conflictSignals: [{ tag: "불명확", evidence: "충분한 언어 신호가 없었습니다." }],
  replySuggestions: [
    { style: "더 부드럽게", text: "내 의도는 비난이 아니라 상황을 정리하고 싶은 마음이야.", why: "방어 반응을 줄일 수 있습니다." },
    { style: "더 명확하게", text: "내가 원하는 건 X야. 가능 여부를 솔직히 알려줘.", why: "요청 범위를 분명하게 합니다." },
    { style: "더 짧게", text: "오해 없게 다시 말하면, 나는 X를 원해.", why: "핵심 전달에 집중합니다." }
  ],
  safetyNote: "이 서비스는 의료/상담 대체가 아닙니다. 위기 상황은 전문가 도움을 권장합니다."
};

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function analyzeWithLLM(userPrompt: string): Promise<AnalysisResponse> {
  if (!client) return fallback;

  for (let i = 0; i < 2; i++) {
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) continue;
    try {
      return JSON.parse(content) as AnalysisResponse;
    } catch {
      continue;
    }
  }

  return fallback;
}

export { fallback };
