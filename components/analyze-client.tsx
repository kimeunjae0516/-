"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { AnalysisResponse, AnalyzeMode, SituationInput } from "@/types/analysis";

async function runClientOCR(file: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("kor+eng");
  const { data } = await worker.recognize(file);
  await worker.terminate();
  return data.text;
}

export function AnalyzeClient() {
  const [mode, setMode] = useState<AnalyzeMode>("paste");
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const [personId, setPersonId] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ocrGuide, setOcrGuide] = useState("");
  const [situation, setSituation] = useState<SituationInput>({ relationship: "", goal: "", myEmotion: "", coreMessage: "", lastMessage: "" });

  const { saveEnabled, toggleSave, load, addPerson, people, addRecord } = useAppStore();

  useEffect(() => {
    load();
  }, [load]);

  const selectedPerson = useMemo(() => people.find((p) => p.id === personId), [people, personId]);

  const onUpload = async (file?: File) => {
    if (!file) return;
    setOcrGuide("OCR 처리 중... 실패 시 이미지 회전/크롭 후 다시 시도하세요.");
    try {
      const extracted = await runClientOCR(file);
      setText(extracted);
      setOcrGuide("추출 완료: 분석 전 텍스트를 꼭 검토/수정하세요.");
    } catch {
      setOcrGuide("OCR 실패: 고해상도 이미지, 회전 보정, 영역 크롭으로 재시도해 주세요.");
    }
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const body = {
        mode,
        text: mode === "situation" ? undefined : text,
        situation: mode === "situation" ? situation : undefined,
        language,
        options: {
          relationshipType: situation.relationship,
          goal: situation.goal,
          saveEnabled,
          personId: personId || undefined
        }
      };
      const res = await fetch("/api/analyze", { method: "POST", body: JSON.stringify(body) });
      if (!res.ok) throw new Error("분석 실패");
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
          userFeeling: situation.myEmotion
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  const addPersonPrompt = () => {
    const nickname = prompt("닉네임(실명 금지)");
    if (nickname) {
      const person = addPerson(nickname);
      setPersonId(person.id);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>통합 분석</CardTitle>
          <CardDescription>상대 의도를 단정하지 않고, 오해를 줄이는 표현으로 분석합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["paste", "ocr", "situation"] as AnalyzeMode[]).map((m) => (
              <Button key={m} variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>{m}</Button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">언어
              <select className="mt-1 w-full rounded-md border p-2" value={language} onChange={(e) => setLanguage(e.target.value as "ko" | "en")}>
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="text-sm">기록 저장
              <div className="mt-2 flex items-center gap-2">
                <input type="checkbox" checked={saveEnabled} onChange={(e) => toggleSave(e.target.checked)} />
                <span className="text-xs text-muted-foreground">기본 OFF / 원문은 저장하지 않음</span>
              </div>
            </label>
          </div>

          {saveEnabled && (
            <div className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">인물 선택(닉네임)</p>
                <Button size="sm" variant="outline" onClick={addPersonPrompt}>인물 추가</Button>
              </div>
              <select className="w-full rounded-md border p-2" value={personId} onChange={(e) => setPersonId(e.target.value)}>
                <option value="">선택 안 함</option>
                {people.map((person) => <option key={person.id} value={person.id}>{person.nickname}</option>)}
              </select>
            </div>
          )}

          {mode === "ocr" && (
            <div className="space-y-2">
              <Input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0])} />
              <p className="text-xs text-muted-foreground">{ocrGuide}</p>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="OCR 결과를 확인/수정 후 분석하세요." />
            </div>
          )}

          {mode === "paste" && (
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="예: 나: ... / 상대: ... 또는 A: ... B: ..." />
          )}

          {mode === "situation" && (
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="관계 (친구/가족/팀 등)" value={situation.relationship} onChange={(e) => setSituation((s) => ({ ...s, relationship: e.target.value }))} />
              <Input placeholder="목적 (사과/거절/요청 등)" value={situation.goal} onChange={(e) => setSituation((s) => ({ ...s, goal: e.target.value }))} />
              <Input placeholder="내 감정" value={situation.myEmotion} onChange={(e) => setSituation((s) => ({ ...s, myEmotion: e.target.value }))} />
              <Input placeholder="상대가 마지막으로 한 말 (선택)" value={situation.lastMessage} onChange={(e) => setSituation((s) => ({ ...s, lastMessage: e.target.value }))} />
              <div className="md:col-span-2"><Textarea placeholder="상대에게 전하고 싶은 핵심 (1~2문장)" value={situation.coreMessage} onChange={(e) => setSituation((s) => ({ ...s, coreMessage: e.target.value }))} /></div>
            </div>
          )}

          <Button onClick={submit} disabled={loading}>{loading ? "분석 중..." : "분석 실행"}</Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-lg">요약</CardTitle></CardHeader>
            <CardContent className="space-y-2"><p>{result.summary}</p><p className="text-xs text-muted-foreground">{result.safetyNote}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">톤 온도</CardTitle></CardHeader>
            <CardContent><p>{result.toneLabel} ({result.toneScore}/100)</p><div className="mt-2 h-3 w-full rounded bg-muted"><div className="h-3 rounded bg-primary" style={{ width: `${result.toneScore}%` }} /></div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">갈등 신호(가능성)</CardTitle></CardHeader>
            <CardContent className="space-y-2">{result.conflictSignals.map((s, i) => <div key={i}><Badge>{s.tag}</Badge><p className="text-xs text-muted-foreground">{s.evidence}</p></div>)}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">오해 포인트 Top 3</CardTitle></CardHeader>
            <CardContent>{result.misunderstandings.map((m, i) => <div key={i} className="mb-3"><p className="text-sm font-medium">“{m.quote}”</p><p className="text-sm text-muted-foreground">{m.reason}</p></div>)}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">다음 메시지 추천</CardTitle></CardHeader>
            <CardContent className="space-y-3">{result.replySuggestions.map((r, i) => <div key={i} className="rounded-md border p-3"><div className="mb-1 flex items-center justify-between"><Badge>{r.style}</Badge><Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(r.text)}>복사</Button></div><p className="text-sm">{r.text}</p><p className="text-xs text-muted-foreground">{r.why}</p></div>)}</CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
