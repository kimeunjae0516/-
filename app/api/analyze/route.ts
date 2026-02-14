import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeWithLLM, fallback } from "@/lib/llm";

const situationSchema = z.object({
  relationship: z.string().default(""),
  goal: z.string().default(""),
  myEmotion: z.string().default(""),
  coreMessage: z.string().default(""),
  lastMessage: z.string().optional()
});

const inputSchema = z.object({
  mode: z.enum(["ocr", "paste", "situation"]),
  text: z.string().max(10000).optional(),
  situation: situationSchema.optional(),
  language: z.enum(["ko", "en"]),
  options: z.object({
    relationshipType: z.string().optional(),
    goal: z.string().optional(),
    saveEnabled: z.boolean().optional(),
    personId: z.string().optional()
  })
});

function buildPrompt(input: z.infer<typeof inputSchema>) {
  const payload = input.mode === "situation"
    ? input.situation
    : {
        text: input.text?.slice(0, 10000),
        speakerHint: "나:/상대: 또는 A:/B: 패턴 기반 자동 구분은 틀릴 수 있음"
      };

  return `다음 입력을 분석해 아래 JSON 스키마로만 출력하세요.

규칙:
- 상대 심리/의도 단정 금지
- "~처럼 들릴 수 있어요" 톤 사용
- 오해 가능 포인트는 evidence가 되도록 짧은 인용 포함
- 갈등 신호는 가능성으로만 제시
- 위험표현이 있으면 완화된 문장 제안

스키마:
{
  "summary": string,
  "toneLabel": string,
  "toneScore": number,
  "misunderstandings": [{"quote": string, "reason": string}],
  "conflictSignals": [{"tag": string, "evidence": string}],
  "replySuggestions": [{"style": "더 부드럽게"|"더 명확하게"|"더 짧게", "text": string, "why": string}],
  "safetyNote": string
}

input=${JSON.stringify({ ...input, payload }, null, 2)}`;
}

export async function POST(req: Request) {
  try {
    const parsed = inputSchema.parse(await req.json());
    if (parsed.mode !== "situation" && !parsed.text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    if (parsed.mode === "situation" && !parsed.situation?.coreMessage) {
      return NextResponse.json({ error: "coreMessage is required" }, { status: 400 });
    }

    const prompt = buildPrompt(parsed);
    const result = await analyzeWithLLM(prompt);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input", detail: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(fallback);
  }
}
