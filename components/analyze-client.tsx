"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { AnalyzeOutput, InputMode } from "@/types/analysis";

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;
  }
}



type SpeechRecognitionResultLike = { 0: { transcript: string } };
type SpeechRecognitionEventLike = { results: SpeechRecognitionResultLike[] | ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const modeLabel: Record<InputMode, string> = { text: "텍스트", ocr: "캡쳐(OCR)", voice: "음성" };

export function AnalyzeClient() {
  const [mode, setMode] = useState<InputMode>("text");
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const [transcript, setTranscript] = useState("");
  const [personId, setPersonId] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [result, setResult] = useState<(AnalyzeOutput & { normalized?: Record<string, unknown> }) | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const [situation, setSituation] = useState({ relationshipType: "", goal: "", myEmotion: "", keyMessage: "", lastMessage: "" });

  const { saveEnabled, setSaveEnabled, load, people, addPerson, addRecord } = useAppStore();

  useEffect(() => { load(); }, [load]);

  const selectedPerson = useMemo(() => people.find((p) => p.id === personId), [people, personId]);

  const onOCR = async (file?: File) => {
    if (!file) return;
    setError(null);
    setOcrProgress(0);
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("kor+eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") setOcrProgress(Math.round((m.progress ?? 0) * 100));
      }
    });
    const out = await worker.recognize(file);
    await worker.terminate();
    setTranscript((prev) => `${prev}\n${out.data.text}`.trim());
    setToast("OCR 추출 완료. 분석 전에 꼭 수정해 주세요.");
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("이 브라우저는 SpeechRecognition을 지원하지 않아요. 최신 Chrome을 권장합니다.");
      return;
    }
    const recognition = new SR();
    recognition.lang = language === "ko" ? "ko-KR" : "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (ev: SpeechRecognitionEventLike) => {
      const merged = Array.from(ev.results).map((r) => r[0].transcript).join(" ");
      setTranscript(merged);
    };
    recognition.onerror = () => setError("음성 인식 중 오류가 발생했어요.");
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const cleanLines = () => setTranscript((t) => t.replace(/\n{2,}/g, "\n").replace(/[ \t]{2,}/g, " ").trim());
  const cleanOCRNoise = () => setTranscript((t) => t.replace(/[|¦`~]{2,}/g, " ").replace(/[◻□■]+/g, " "));
  const guessSpeakers = () => setTranscript((t) => t.replace(/(\b나\b|me)/gi, "me:").replace(/(상대|other)/gi, "other"));
  const fillExample = () => setTranscript("me: 어제 답장이 늦어서 서운했어.\nother: 바빠서 못 봤어. 왜 그렇게 예민해?\nme: 비난하려던 건 아니고, 다음엔 한 줄만 알려주면 좋겠어.");

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, language, rawText: transcript, situation, options: { saveEnabled, personId: personId || undefined } })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "분석 실패");
      setResult(json);
      if (saveEnabled) {
        await addRecord({
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          mode,
          personId: selectedPerson?.id,
          relationshipType: situation.relationshipType || undefined,
          goal: situation.goal || undefined,
          userFeeling: situation.myEmotion || undefined,
          toneScore: json.toneScore,
          toneLabel: json.toneLabel,
          conflictTags: json.conflictSignals.map((s: { tag: string }) => s.tag)
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했어요");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {toast && <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm">{toast}</div>}
      <Card>
        <CardHeader>
          <CardTitle>대화 분석</CardTitle>
          <CardDescription>실명/민감정보 입력 금지. 저장 기본 OFF, 원문은 저장하지 않아요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2" role="tablist" aria-label="input mode">
            {(["text", "ocr", "voice"] as InputMode[]).map((m) => (
              <Button key={m} variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)} aria-label={`${modeLabel[m]} 모드`}>
                {modeLabel[m]}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">언어
              <select className="mt-1 w-full rounded-md border p-2" value={language} onChange={(e) => setLanguage(e.target.value as "ko" | "en")}> 
                <option value="ko">한국어</option><option value="en">English</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm pt-6"><input type="checkbox" checked={saveEnabled} onChange={(e) => setSaveEnabled(e.target.checked)} /> 저장 ON (메타데이터만)</label>
          </div>

          {saveEnabled && <div className="space-y-2 rounded-xl border p-3"><div className="flex justify-between"><p className="text-sm">닉네임 선택 (실명 금지)</p><Button size="sm" variant="outline" onClick={async () => { const n = prompt("닉네임"); if (n) { const p = await addPerson(n); setPersonId(p.id); } }}>추가</Button></div><select className="w-full rounded border p-2" value={personId} onChange={(e) => setPersonId(e.target.value)}><option value="">선택 안 함</option>{people.map((p) => <option key={p.id} value={p.id}>{p.nickname}</option>)}</select></div>}

          <div className="grid gap-2 md:grid-cols-2">
            <Input placeholder="관계 (친구/팀...)" value={situation.relationshipType} onChange={(e) => setSituation((s) => ({ ...s, relationshipType: e.target.value }))} />
            <Input placeholder="목적 (사과/요청...)" value={situation.goal} onChange={(e) => setSituation((s) => ({ ...s, goal: e.target.value }))} />
            <Input placeholder="내 감정" value={situation.myEmotion} onChange={(e) => setSituation((s) => ({ ...s, myEmotion: e.target.value }))} />
            <Input placeholder="상대 마지막 말" value={situation.lastMessage} onChange={(e) => setSituation((s) => ({ ...s, lastMessage: e.target.value }))} />
            <div className="md:col-span-2"><Textarea placeholder="내 핵심 메시지" value={situation.keyMessage} onChange={(e) => setSituation((s) => ({ ...s, keyMessage: e.target.value }))} /></div>
          </div>

          {mode === "ocr" && <div className="space-y-2"><Input type="file" accept="image/*" onChange={(e) => onOCR(e.target.files?.[0])} />{ocrProgress > 0 && <p className="text-xs text-muted-foreground">OCR 진행률: {ocrProgress}%</p>}</div>}
          {mode === "voice" && <div className="flex gap-2"> <Button type="button" onClick={startVoice} disabled={isListening}>음성 시작</Button> <Button type="button" variant="outline" onClick={stopVoice} disabled={!isListening}>음성 정지</Button></div>}

          <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={9} aria-label="editable transcript" placeholder="여기에 대화 텍스트를 붙여넣거나 OCR/STT로 가져오세요." />
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={fillExample}>예시 넣기</Button><Button variant="outline" onClick={cleanLines}>줄바꿈 정리</Button><Button variant="outline" onClick={guessSpeakers}>화자 추정</Button><Button variant="outline" onClick={cleanOCRNoise}>OCR 잡음 제거</Button></div>
          <Button onClick={submit} disabled={loading}>{loading ? "분석 중..." : "Analyze"}</Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      {loading && <Card><CardContent className="p-6"><div className="animate-pulse space-y-2"><div className="h-4 w-1/2 rounded bg-muted" /><div className="h-4 w-2/3 rounded bg-muted" /><div className="h-4 w-1/3 rounded bg-muted" /></div></CardContent></Card>}

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2"><CardHeader><CardTitle>요약</CardTitle></CardHeader><CardContent><p>{result.summary}</p><p className="mt-2 text-xs text-muted-foreground">{result.safetyNote}</p></CardContent></Card>
          <Card><CardHeader><CardTitle>톤 게이지</CardTitle></CardHeader><CardContent><p>{result.toneLabel} ({result.toneScore})</p><div className="mt-3 h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-emerald-500" style={{ width: `${result.toneScore}%` }} /></div></CardContent></Card>
          <Card><CardHeader><CardTitle>정확도(신뢰도)</CardTitle></CardHeader><CardContent><p>{Math.round(result.confidence.overall * 100)}%</p><p className="text-xs text-muted-foreground">{result.confidence.why}</p></CardContent></Card>

          <Card><CardHeader><CardTitle>오해 포인트 TOP 3</CardTitle></CardHeader><CardContent className="space-y-2">{result.misunderstandings.map((m, i) => <div key={i}><p className="font-medium">&quot;{m.quote}&quot;</p><p className="text-sm text-muted-foreground">{m.reason}</p></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>갈등 신호 태그</CardTitle></CardHeader><CardContent className="space-y-2">{result.conflictSignals.map((s, i) => <div key={i}><Badge>{s.tag}</Badge><p className="text-xs text-muted-foreground">{s.evidence}</p></div>)}</CardContent></Card>

          <Card className="lg:col-span-2"><CardHeader><CardTitle>답장 제안</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">{result.replySuggestions.map((r) => <div key={r.style} className="rounded-xl border p-3"><div className="mb-2 flex items-center justify-between"><Badge>{r.style}</Badge><Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(r.text)}>복사</Button></div><p className="text-sm">{r.text}</p><p className="mt-2 text-xs text-muted-foreground">{r.why}</p></div>)}</CardContent></Card>
          {result.clarificationQuestions.length > 0 && <Card className="lg:col-span-2"><CardHeader><CardTitle>추가로 물어볼 질문</CardTitle></CardHeader><CardContent className="space-y-1">{result.clarificationQuestions.map((q, i) => <p key={i} className="text-sm">• {q}</p>)}</CardContent></Card>}
        </div>
      )}
    </div>
  );
}
