export type AnalyzeMode = "ocr" | "paste" | "situation";

export interface SituationInput {
  relationship: string;
  goal: string;
  myEmotion: string;
  coreMessage: string;
  lastMessage?: string;
}

export interface AnalysisResponse {
  summary: string;
  toneLabel: string;
  toneScore: number;
  misunderstandings: { quote: string; reason: string }[];
  conflictSignals: { tag: string; evidence: string }[];
  replySuggestions: { style: string; text: string; why: string }[];
  safetyNote: string;
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
}

export interface PersonProfile {
  id: string;
  nickname: string;
  createdAt: number;
}
