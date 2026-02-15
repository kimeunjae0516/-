import { z } from "zod";

export const situationSchema = z
  .object({
    relationshipType: z.string().max(40).optional(),
    goal: z.string().max(40).optional(),
    myEmotion: z.string().max(40).optional(),
    keyMessage: z.string().max(1000).optional(),
    lastMessage: z.string().max(1000).optional()
  })
  .optional();

export const analyzeInputSchema = z
  .object({
    mode: z.enum(["text", "ocr", "voice"]),
    language: z.enum(["ko", "en"]),
    rawText: z.string().max(10000).optional(),
    situation: situationSchema,
    options: z
      .object({
        saveEnabled: z.boolean().optional(),
        personId: z.string().max(80).optional()
      })
      .optional()
  })
  .superRefine((val, ctx) => {
    const hasText = Boolean(val.rawText?.trim());
    const hasSituationText = Boolean(val.situation?.keyMessage?.trim() || val.situation?.lastMessage?.trim());
    if (!hasText && !hasSituationText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "rawText 또는 situation.keyMessage/lastMessage 중 하나는 필요합니다.",
        path: ["rawText"]
      });
    }
  });

export const normalizeOutputSchema = z.object({
  detectedLanguage: z.enum(["ko", "en"]),
  cleanedText: z.string(),
  extractedContext: z.object({
    relationshipType: z.enum(["친구", "가족", "선생님", "팀", "연인", "기타"]).nullable(),
    goal: z.enum(["사과", "거절", "요청", "서운함", "조율", "감사", "기타"]).nullable(),
    myEmotion: z.enum(["서운함", "화남", "불안", "혼란", "중립"]).nullable(),
    keyMessage: z.string().nullable(),
    lastMessage: z.string().nullable()
  }),
  conversationTurns: z.array(
    z.object({
      speaker: z.enum(["me", "other", "A", "B", "unknown"]),
      text: z.string()
    })
  ),
  confidence: z.object({
    context: z.number().min(0).max(1),
    speakers: z.number().min(0).max(1),
    overall: z.number().min(0).max(1)
  }),
  clarificationQuestions: z.array(z.string()).max(3)
});

export const analyzeOutputSchema = z.object({
  summary: z.string(),
  toneLabel: z.string(),
  toneScore: z.number().min(0).max(100),
  misunderstandings: z.array(z.object({ quote: z.string(), reason: z.string() })).max(3),
  conflictSignals: z.array(z.object({ tag: z.string(), evidence: z.string() })).max(6),
  replySuggestions: z
    .array(
      z.object({
        style: z.enum(["soft", "clear", "short"]),
        text: z.string(),
        why: z.string()
      })
    )
    .length(3),
  safetyNote: z.string(),
  confidence: z.object({
    overall: z.number().min(0).max(1),
    why: z.string()
  }),
  clarificationQuestions: z.array(z.string()).max(3)
});
