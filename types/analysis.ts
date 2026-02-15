export type AnalyzeMode = "text" | "ocr" | "voice";

export interface SituationInput {
  relationship?: string;
  goal?: string;
  myEmotion?: string;
  coreMessage?: string;
  lastMessage?: string;
}

export interface NormalizeResponse {
  detectedLanguage: "ko" | "en";
  cleanedText: string;
  extractedContext: {
    relationshipType: "친구" | "가족" | "선생님" | "팀" | "연인" | "기타" | null;
    goal: "사과" | "거절" | "요청" | "서운함" | "조율" | "감사" | "기타" | null;
    myEmotion: "서운함" | "화남" | "불안" | "혼란" | "중립" | null;
    keyMessage: string | null;
    lastMessage: string | null;
  };
  conversationTurns: { speaker: "me" | "other" | "A" | "B" | "unknown"; text: string }[];
  confidence: { context: number; speakers: number; overall: number };
  clarificationQuestions: string[];
}

export interface AnalysisResponse {
  summary: string;
  toneLabel: string;
  toneScore: number;
  misunderstandings: { quote: string; reason: string }[];
  conflictSignals: { tag: string; evidence: string }[];
  replySuggestions: { style: "soft" | "clear" | "short"; text: string; why: string }[];
  safetyNote: string;
  confidence: { overall: number; why: string };
  clarificationQuestions: string[];
}

export interface AnalysisRecord {
  id: string;
  createdAt: number;
  mode: AnalyzeMode;
  personId?: string;
  relationshipType?: string;
  goal?: string;
  toneScore: number;
  toneLabel: string;
  conflictTags: string[];
  userFeeling?: string;
  selectedSuggestionStyle?: string;
  summary?: string;
}

export interface PersonProfile {
  id: string;
  nickname: string;
  createdAt: number;
}
