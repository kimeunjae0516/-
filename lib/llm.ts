import OpenAI from "openai";
import { AnalysisResponse, NormalizeResponse } from "@/types/analysis";
import { safeJSONParse } from "@/lib/llm/json";

export const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function completionJSON<T>(opts: {
  system: string;
  user: string;
  temperature: number;
  maxTokens?: number;
}): Promise<T | null> {
  if (!client) return null;

  for (let i = 0; i < 2; i++) {
    const res = await client.chat.completions.create({
      model: MODEL,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens ?? 1100,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user }
      ]
    });
    const content = res.choices[0]?.message?.content;
    if (!content) continue;
    const parsed = safeJSONParse<T>(content);
    if (parsed) return parsed;
  }
  return null;
}

export const normalizeFallback: NormalizeResponse = {
  detectedLanguage: "ko",
  cleanedText: "",
  extractedContext: {
    relationshipType: null,
    goal: null,
    myEmotion: null,
    keyMessage: null,
    lastMessage: null
  },
  conversationTurns: [],
  confidence: { context: 0.35, speakers: 0.2, overall: 0.3 },
  clarificationQuestions: ["상대와의 관계를 알려줄 수 있을까요?", "가장 최근에 오간 문장을 1~2개 추가해줄 수 있을까요?"]
};

export const analysisFallback: AnalysisResponse = {
  summary: "현재 정보로도 대화가 다소 예민하거나 오해될 여지가 있어 보여요. 핵심 의도와 요청을 한 문장으로 정리하면 정확도가 더 올라가요.",
  toneLabel: "중립에 가까움",
  toneScore: 56,
  misunderstandings: [{ quote: "핵심 표현 일부", reason: "단정적으로 들릴 수 있어요. 목적/요청을 분리하면 오해가 줄어들 수 있어요." }],
  conflictSignals: [{ tag: "단정", evidence: "" }],
  replySuggestions: [
    { style: "soft", text: "내가 전달을 서툴게 했을 수 있어. 내 의도는 비난이 아니라 상황을 맞추고 싶은 거야.", why: "상대 방어를 낮추며 대화 재개에 유리해요." },
    { style: "clear", text: "내가 원하는 건 X야. 가능한 범위를 알려주면 그에 맞춰 조율할게.", why: "요청 범위를 선명하게 해서 엇갈림을 줄여요." },
    { style: "short", text: "오해 없게 말하면, 나는 X를 원하고 Y는 어렵다고 느껴.", why: "짧게 핵심만 전달해 감정 소모를 줄여요." }
  ],
  safetyNote: "이 서비스는 의료/상담 대체가 아닙니다. 자해·폭력 등 위험이 느껴지면 구체 대응보다 가까운 전문가/긴급 지원에 즉시 도움을 요청하세요.",
  confidence: { overall: 0.45, why: "입력 맥락이 일부 제한적이라 보수적으로 해석했어요." },
  clarificationQuestions: ["당신의 최종 목표(사과/요청/거절)를 하나만 고르면 무엇인가요?"]
};
