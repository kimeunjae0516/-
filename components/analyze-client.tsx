"use client";

import { useEffect, useMemo, useState } from "react";
import { Mic, MicOff, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useAppStore } from "@/lib/store";
import { AnalysisResponse, AnalyzeMode, SituationInput } from "@/types/analysis";

function cleanupText(text: string) {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[|¦‖]+/g, " ")
    .replace(/([!?.,])\1{2,}/g, "$1$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeLines(text: string) {
  return text.split("\n").map((line) => line.trim()).filter(Boolean).join("\n");
}

function inferSpeakerLabels(text: string) {
  return text.split("\n").map((line, i) => {
    if (/^(나|내가|me)\s*:/i.test(line) || /^(상대|other)\s*:/i.test(line)) return line;
    return `${i % 2 === 0 ? "A" : "B"}: ${line}`;
  }).join("\n");
}

function removeWeirdChars(text: string) {
  return text.replace(/[^\p{L}\p{N}\p{P}\p{Z}\n]/gu, "");
}

export function AnalyzeClient() {
  const [mode, setMode] = useState<AnalyzeMode>("text");
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const [personId, setPersonId] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [situation, setSituation] = useState<SituationInput>({});

  const { saveEnabled, toggleSave, load, addPerson, people, addRecord } = useAppStore();
  const speech = useSpeechToText(language);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!speech.liveText) return;
    setText((prev) => cleanupText(`${prev}\n${speech.liveText}`));
  }, [speech.liveText]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  const selectedPerson = useMemo(() => people.find((p) => p.id === personId), [people, personId]);

  const onUpload = async (file?: File) => {
    if (!file) return;
    setOcrProgress(1);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("kor+eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round((m.progress ?? 0) * 100));
          }
        }
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setText(cleanupText(data.text));
      setOcrProgress(100);
      setToast("OCR 완료! 추출 텍스트를 꼭 수정해 주세요.");
    } catch {
      setToast("OCR 실패: 이미지 회전/크롭 후 재시도해 주세요.");
      setOcrProgress(0);
    }
  };

  const submit = async () => {
    if (!text.trim()) {
      setToast("대화/내용을 입력해 주세요.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          text,
          language,
          situation,
          options: {
            relationshipType: situation.relationship,
            goal: situation.goal,
            saveEnabled,
            personId: personId || undefined
          }
        })
      });
      if (!res.ok) throw new Error("요청 실패");
      const json = (await res.json()) as AnalysisResponse;
      setResult(json);
      if (saveEnabled) {
        addRecord({
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          mode,
          personId: selectedPerson?.id,
          relationshipType: situation.relationship,
          goal: situation.goal,
          toneScore: json.toneScore,
          toneLabel: json.toneLabel,
          conflictTags: json.conflictSignals.map((s) => s.tag),
          userFeeling: situation.myEmotion,
          summary: json.summary
        });
      }
    } catch {
      setToast("분석 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const addPersonPrompt = () => {
    const nickname = prompt("닉네임(실명 금지)");
    if (!nickname) return;
    const person = addPerson(nickname);
    setPersonId(person.id);
  };

  return (
    <div className="space-y-6 pb-20">
      {toast && <div className="fixed right-4 top-20 z-50 rounded-lg bg-foreground px-4 py-2 text-sm text-white shadow">{toast}</div>}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">분석 입력 <Badge>Privacy-first 🔒</Badge></CardTitle>
          <CardDescription>원문 저장은 기본 OFF이며, 저장 ON이어도 메타데이터만 저장됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="inline-flex rounded-lg border bg-muted p-1">
            {([
              ["text", "텍스트"],
              ["ocr", "캡쳐(OCR)"],
              ["voice", "음성"]
            ] as const).map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)} className={`rounded-md px-3 py-1.5 text-sm ${mode === m ? "bg-white shadow" : "text-muted-foreground"}`}>{label}</button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select className="rounded-md border p-2 text-sm" value={language} onChange={(e) => setLanguage(e.target.value as "ko" | "en")}>
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
            <label className="flex items-center gap-2 rounded-md border p-2 text-sm">
              <input type="checkbox" checked={saveEnabled} onChange={(e) => toggleSave(e.target.checked)} />
              기록 저장 ON/OFF (기본 OFF)
            </label>
          </div>

          {saveEnabled && (
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm">인물 닉네임(실명 금지)</p>
                <Button size="sm" variant="outline" onClick={addPersonPrompt}>추가</Button>
              </div>
              <select className="w-full rounded-md border p-2 text-sm" value={personId} onChange={(e) => setPersonId(e.target.value)}>
                <option value="">선택 안 함</option>
                {people.map((person) => <option key={person.id} value={person.id}>{person.nickname}</option>)}
              </select>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="관계(친구/가족/팀/기타)" value={situation.relationship ?? ""} onChange={(e) => setSituation((s) => ({ ...s, relationship: e.target.value }))} />
            <Input placeholder="목적(사과/요청/거절/조율...)" value={situation.goal ?? ""} onChange={(e) => setSituation((s) => ({ ...s, goal: e.target.value }))} />
            <Input placeholder="내 감정(선택)" value={situation.myEmotion ?? ""} onChange={(e) => setSituation((s) => ({ ...s, myEmotion: e.target.value }))} />
            <Input placeholder="상대 마지막 말(선택)" value={situation.lastMessage ?? ""} onChange={(e) => setSituation((s) => ({ ...s, lastMessage: e.target.value }))} />
            <div className="md:col-span-2">
              <Textarea placeholder="상대에게 전하고 싶은 핵심 (1~2문장)" value={situation.coreMessage ?? ""} onChange={(e) => setSituation((s) => ({ ...s, coreMessage: e.target.value }))} />
            </div>
          </div>

          {mode === "ocr" && (
            <div className="space-y-2 rounded-lg border p-3">
              <Input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0])} />
              <div className="h-2 w-full rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${ocrProgress}%` }} /></div>
              <p className="text-xs text-muted-foreground">OCR 진행률 {ocrProgress}%</p>
            </div>
          )}

          {mode === "voice" && (
            <div className="space-y-2 rounded-lg border p-3">
              {!speech.supported ? (
                <p className="text-sm text-muted-foreground">이 브라우저는 음성 인식을 지원하지 않아요. 텍스트 입력을 이용해 주세요.</p>
              ) : (
                <div className="flex gap-2">
                  <Button variant={speech.listening ? "outline" : "default"} onClick={speech.start} disabled={speech.listening}><Mic className="mr-1 h-4 w-4" /> 시작</Button>
                  <Button variant="outline" onClick={speech.stop} disabled={!speech.listening}><MicOff className="mr-1 h-4 w-4" /> 중지</Button>
                </div>
              )}
              {speech.liveText && <p className="rounded bg-muted p-2 text-sm">실시간 전사: {speech.liveText}</p>}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setText(cleanupText(text))}><WandSparkles className="mr-1 h-4 w-4" />정리 버튼(옵션)</Button>
              <Button size="sm" variant="outline" onClick={() => setText(normalizeLines(text))}>줄바꿈 정리</Button>
              <Button size="sm" variant="outline" onClick={() => setText(inferSpeakerLabels(text))}>화자 라벨 추정</Button>
              <Button size="sm" variant="outline" onClick={() => setText(removeWeirdChars(text))}>이상한 문자 제거</Button>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"대화/내용 입력\n예) 나: 오늘은 일정이 어려워\n상대: 왜 또 안돼?\n또는 자유서술 가능"}
              className="min-h-[220px]"
            />
          </div>

          <Button onClick={submit} disabled={loading}>{loading ? "분석 중..." : "분석 실행"}</Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>요약</CardTitle></CardHeader>
            <CardContent>
              <p>{result.summary}</p>
              <p className="mt-2 text-sm text-muted-foreground">신뢰도: {(result.confidence.overall * 100).toFixed(0)}% · {result.confidence.why}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>톤 온도</CardTitle></CardHeader>
            <CardContent>
              <p>{result.toneLabel} ({result.toneScore}/100)</p>
              <div className="mt-2 h-3 rounded bg-muted"><div className="h-3 rounded bg-primary" style={{ width: `${result.toneScore}%` }} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>갈등 신호(가능성)</CardTitle></CardHeader>
            <CardContent className="space-y-2">{result.conflictSignals.map((s, i) => <div key={i}><Badge>{s.tag}</Badge><p className="text-xs text-muted-foreground">{s.evidence}</p></div>)}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>오해 포인트 Top 3</CardTitle></CardHeader>
            <CardContent className="space-y-3">{result.misunderstandings.map((m, i) => <div key={i}><p className="font-medium">“{m.quote}”</p><p className="text-sm text-muted-foreground">{m.reason}</p></div>)}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>다음 메시지 3종</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {result.replySuggestions.map((r) => (
                <div key={r.style} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center justify-between"><Badge>{r.style}</Badge><Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(r.text)}>복사</Button></div>
                  <p className="text-sm">{r.text}</p>
                  <p className="text-xs text-muted-foreground">{r.why}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>추가 질문 & 안전 안내</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm">{result.clarificationQuestions.map((q, i) => <li key={i}>{q}</li>)}</ul>
              <p className="mt-2 text-sm text-muted-foreground">{result.safetyNote}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
