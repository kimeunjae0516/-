"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";

export function HistoryClient() {
  const { records, people, load } = useAppStore();
  const [personFilter, setPersonFilter] = useState("");
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => records.filter((r) => (personFilter ? r.personId === personFilter : true)),
    [records, personFilter]
  );

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle>저장 기록 (메타데이터 전용)</CardTitle></CardHeader><CardContent><select className="rounded border p-2" value={personFilter} onChange={(e) => setPersonFilter(e.target.value)}><option value="">전체</option>{people.map((p) => <option key={p.id} value={p.id}>{p.nickname}</option>)}</select></CardContent></Card>
      {filtered.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-4 text-sm">
            <p>{new Date(r.createdAt).toLocaleString()} · {r.mode} · {r.toneLabel} ({r.toneScore})</p>
            <p className="text-muted-foreground">태그: {r.conflictTags.join(", ") || "없음"}</p>
          </CardContent>
        </Card>
      ))}
      {filtered.length === 0 && <p className="text-sm text-muted-foreground">아직 저장된 기록이 없어요.</p>}
    </div>
  );
}
