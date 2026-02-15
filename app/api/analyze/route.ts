import { NextResponse } from "next/server";
import { z } from "zod";
import { callLlmJson } from "@/lib/llm/client";
import { parseJsonWithRetry } from "@/lib/llm/json";
import { buildAnalyzePrompt, buildNormalizePrompt, analyzeSystemPrompt, normalizeSystemPrompt } from "@/lib/llm/prompts";
import { analyzeOutputSchema, analyzeInputSchema, normalizeOutputSchema } from "@/lib/schemas/analyze";
import { AnalyzeOutput } from "@/types/analysis";

const SAFE_FALLBACK: AnalyzeOutput = {
  summary: "입력 내용을 바탕으로 핵심 흐름은 파악했지만, 일부 맥락은 불분명해요. 표현을 조금 더 구체화하면 정확도가 올라갈 수 있어요.",
  toneLabel: "맥락 재확인 필요",
  toneScore: 44,
  misunderstandings: [
    { quote: "핵심 문장 부족", reason: "메시지 목적이 짧게 제시돼 해석이 엇갈릴 가능성이 있어요." }
  ],
  conflictSignals: [{ tag: "감정회피", evidence: "감정 단서 적음" }],
  replySuggestions: [
    { style: "soft", text: "내 의도는 비난이 아니라 상황을 정리하고 싶은 마음이야.", why: "방어적으로 들릴 가능성을 줄여요." },
    { style: "clear", text: "내가 원하는 건 일정 조율이야. 가능한 시간 하나만 알려줘.", why: "요청 범위를 명확하게 해요." },
    { style: "short", text: "오해 없게 핵심만 말하면, 나는 일정 조율이 필요해.", why: "핵심 전달을 빠르게 만들어요." }
  ],
  safetyNote: "이 서비스는 치료/진단 서비스가 아니에요. 위험이 크거나 급하면 지역 응급/상담 도움을 먼저 찾아주세요.",
  confidence: { overall: 0.45, why: "원문 맥락이 제한적입니다." },
  clarificationQuestions: ["상대와의 관계(친구/팀 등)를 알려줄 수 있나요?"]
};

function clip(str: string, max = 20) {
  return str.length <= max ? str : str.slice(0, max);
}

function enforceRuntimeRules(data: AnalyzeOutput): AnalyzeOutput {
  const map = new Map(data.replySuggestions.map((s) => [s.style, s]));
  return {
    ...data,
    toneScore: Math.max(0, Math.min(100, Math.round(data.toneScore))),
    misunderstandings: data.misunderstandings.slice(0, 3).map((m) => ({ ...m, quote: clip(m.quote) })),
    conflictSignals: data.conflictSignals.slice(0, 6).map((c) => ({ ...c, evidence: clip(c.evidence) })),
    replySuggestions: ["soft", "clear", "short"].map((style) =>
      map.get(style as "soft" | "clear" | "short") ?? {
        style: style as "soft" | "clear" | "short",
        text: "조금 더 정확한 입력이 있으면 맞춤 문장을 제안할 수 있어요.",
        why: "정보 부족으로 일반형 안내를 제공합니다."
      }
    ),
    clarificationQuestions: data.clarificationQuestions.slice(0, 3)
  };
}

function hasHighRisk(text: string) {
  return /(자해|죽고 싶|해치고 싶|suicide|kill myself|extreme danger)/i.test(text);
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = analyzeInputSchema.parse(json);
    const rawLen = input.rawText?.length ?? 0;
    console.info("[analyze] request", { mode: input.mode, lang: input.language, rawLen, saveEnabled: input.options?.saveEnabled ?? false });

    const normalize = await parseJsonWithRetry(async () => callLlmJson(normalizeSystemPrompt, buildNormalizePrompt(input)), 1);
    const normalized = normalizeOutputSchema.parse(normalize);

    const analyze = await parseJsonWithRetry(async () => callLlmJson(analyzeSystemPrompt, buildAnalyzePrompt(normalized)), 1);
    const analyzed = analyzeOutputSchema.parse(analyze);

    let safe = enforceRuntimeRules(analyzed);
    if (hasHighRisk(`${input.rawText ?? ""} ${normalized.cleanedText}`)) {
      safe = {
        ...safe,
        safetyNote:
          "지금 많이 힘들 수 있어요. 혼자 버티기 어렵다면 지역 응급전화 또는 신뢰할 수 있는 보호자/상담기관에 바로 도움을 요청해 주세요."
      };
    }

    return NextResponse.json({ normalized, ...safe });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input", detail: error.flatten() }, { status: 400 });
    }
    console.error("[analyze] failure", { message: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json(SAFE_FALLBACK);
  }
}
