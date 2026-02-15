export type InputMode = "text" | "ocr" | "voice";

export type RelationshipType = "친구" | "가족" | "선생님" | "팀" | "연인" | "기타";
export type GoalType = "사과" | "거절" | "요청" | "서운함" | "조율" | "감사" | "기타";
export type EmotionType = "서운함" | "화남" | "불안" | "혼란" | "중립";

export interface AnalysisRecord {
  id: string;
  createdAt: number;
  mode: InputMode;
  personId?: string;
  relationshipType?: string;
  goal?: string;
  userFeeling?: string;
  toneScore: number;
  toneLabel: string;
  conflictTags: string[];
  selectedSuggestionStyle?: "soft" | "clear" | "short";
}

export interface PersonProfile {
  id: string;
  nickname: string;
  createdAt: number;
}

export interface NormalizeOutput {
  detectedLanguage: "ko" | "en";
  cleanedText: string;
  extractedContext: {
    relationshipType: RelationshipType | null;
    goal: GoalType | null;
    myEmotion: EmotionType | null;
    keyMessage: string | null;
    lastMessage: string | null;
  };
  conversationTurns: Array<{
    speaker: "me" | "other" | "A" | "B" | "unknown";
    text: string;
  }>;
  confidence: { context: number; speakers: number; overall: number };
  clarificationQuestions: string[];
}

export interface AnalyzeOutput {
  summary: string;
  toneLabel: string;
  toneScore: number;
  misunderstandings: Array<{ quote: string; reason: string }>;
  conflictSignals: Array<{ tag: string; evidence: string }>;
  replySuggestions: Array<{ style: "soft" | "clear" | "short"; text: string; why: string }>;
  safetyNote: string;
  confidence: { overall: number; why: string };
  clarificationQuestions: string[];
}

export interface AnalyzeRequestBody {
  mode: InputMode;
  language: "ko" | "en";
  rawText?: string;
  situation?: {
    relationshipType?: string;
    goal?: string;
    myEmotion?: string;
    keyMessage?: string;
    lastMessage?: string;
  };
  options?: {
    saveEnabled?: boolean;
    personId?: string;
  };
}
