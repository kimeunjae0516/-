import { NextResponse } from "next/server";
import { z } from "zod";
import { completionJSON, normalizeFallback, analysisFallback } from "@/lib/llm";
import { ANALYZE_SYSTEM_PROMPT, NORMALIZE_SYSTEM_PROMPT, buildAnalyzeUserPrompt, buildNormalizeUserPrompt } from "@/lib/llm/prompts";
import { AnalysisResponse, NormalizeResponse } from "@/types/analysis";

const situationSchema = z.object({
  relationship: z.string().optional(),
  goal: z.string().optional(),
  myEmotion: z.string().optional(),
  coreMessage: z.string().optional(),
  lastMessage: z.string().optional()
});

const inputSchema = z.object({
  mode: z.enum(["text", "ocr", "voice"]),
  text: z.string().min(1).max(10000),
  language: z.enum(["ko", "en"]).default("ko"),
  situation: situationSchema.optional(),
  options: z.object({
    relationshipType: z.string().optional(),
    goal: z.string().optional(),
    saveEnabled: z.boolean().optional(),
    personId: z.string().optional()
  }).optional()
});

const normalizedSchema: z.ZodType<NormalizeResponse> = z.object({
  detectedLanguage: z.enum(["ko", "en"]),
  cleanedText: z.string(),
  extractedContext: z.object({
    relationshipType: z.enum(["친구", "가족", "선생님", "팀", "연인", "기타"]).nullable(),
    goal: z.enum(["사과", "거절", "요청", "서운함", "조율", "감사", "기타"]).nullable(),
    myEmotion: z.enum(["서운함", "화남", "불안", "혼란", "중립"]).nullable(),
    keyMessage: z.string().nullable(),
    lastMessage: z.string().nullable()
  }),
  conversationTurns: z.array(z.object({ speaker: z.enum(["me", "other", "A", "B", "unknown"]), text: z.string() })),
  confidence: z.object({ context: z.number(), speakers: z.number(), overall: z.number() }),
  clarificationQuestions: z.array(z.string()).max(3)
});

const analysisSchema: z.ZodType<AnalysisResponse> = z.object({
  summary: z.string(),
  toneLabel: z.string(),
  toneScore: z.number(),
  misunderstandings: z.array(z.object({ quote: z.string(), reason: z.string() })).max(3),
  conflictSignals: z.array(z.object({ tag: z.string(), evidence: z.string() })).max(6),
  replySuggestions: z.array(z.object({ style: z.enum(["soft", "clear", "short"]), text: z.string(), why: z.string() })),
  safetyNote: z.string(),
  confidence: z.object({ overall: z.number(), why: z.string() }),
  clarificationQuestions: z.array(z.string()).max(3)
});

const allowedTags = new Set(["비난", "단정", "방어", "회피", "명령형", "비꼼", "무시", "압박", "감정회피", "과잉사과", "책임전가"]);

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

function sanitizeOutput(raw: AnalysisResponse, normalized: NormalizeResponse): AnalysisResponse {
  const suggestions = new Map(raw.replySuggestions.map((s) => [s.style, s]));
  const withStyles: AnalysisResponse["replySuggestions"] = [
    suggestions.get("soft") ?? analysisFallback.replySuggestions[0],
    suggestions.get("clear") ?? analysisFallback.replySuggestions[1],
    suggestions.get("short") ?? analysisFallback.replySuggestions[2]
  ];

  const signals = raw.conflictSignals
    .filter((s) => allowedTags.has(s.tag) && s.evidence.trim().length > 0)
    .slice(0, 6);

  return {
    ...raw,
    toneScore: Math.round(clamp(raw.toneScore, 0, 100)),
    misunderstandings: raw.misunderstandings.slice(0, 3),
    conflictSignals: signals,
    replySuggestions: withStyles,
    confidence: {
      overall: clamp(raw.confidence.overall),
      why: raw.confidence.why || "입력 품질과 맥락 완성도를 함께 반영했어요."
    },
    clarificationQuestions: (raw.clarificationQuestions.length ? raw.clarificationQuestions : normalized.clarificationQuestions).slice(0, 3),
    safetyNote: raw.safetyNote || analysisFallback.safetyNote
  };
}

function dangerSafetyOverride(text: string, output: AnalysisResponse) {
  const risk = /(자해|극단|죽고 싶|죽고싶|해치고 싶|폭력|해칠)/i.test(text);
  if (!risk) return output;
  return {
    ...output,
    safetyNote: "지금 상황이 매우 버겁게 느껴진다면, 혼자 버티지 말고 신뢰할 수 있는 사람이나 지역 정신건강센터/상담기관 등 전문가 도움을 바로 요청해 주세요."
  };
}

export async function POST(req: Request) {
  try {
    const input = inputSchema.parse(await req.json());

    const normalizedRaw = await completionJSON<NormalizeResponse>({
      system: NORMALIZE_SYSTEM_PROMPT,
      user: buildNormalizeUserPrompt({ language: input.language, text: input.text, situation: input.situation }),
      temperature: 0.3,
      maxTokens: 1000
    });

    const normalized = normalizedSchema.safeParse(normalizedRaw).success
      ? normalizedSchema.parse(normalizedRaw)
      : {
          ...normalizeFallback,
          detectedLanguage: input.language,
          cleanedText: input.text
        };

    const analyzeRaw = await completionJSON<AnalysisResponse>({
      system: ANALYZE_SYSTEM_PROMPT,
      user: buildAnalyzeUserPrompt(normalized),
      temperature: 0.4,
      maxTokens: 1200
    });

    const parsed = analysisSchema.safeParse(analyzeRaw).success ? analysisSchema.parse(analyzeRaw) : analysisFallback;
    const sanitized = sanitizeOutput(parsed, normalized);
    return NextResponse.json(dangerSafetyOverride(input.text, sanitized));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input", detail: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(analysisFallback);
  }
}
