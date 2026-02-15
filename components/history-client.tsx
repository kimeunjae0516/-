"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function HistoryClient() {
  const { records, load } = useAppStore();
  useEffect(() => { load(); }, [load]);

  return (
    <Card>
      <CardHeader><CardTitle>분석 기록</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {records.length === 0 ? <p className="text-sm text-muted-foreground">저장된 기록이 없습니다. 저장 ON 후 분석해보세요.</p> : records.map((r) => (
          <div key={r.id} className="rounded-lg border p-3 text-sm">
            <p>{new Date(r.createdAt).toLocaleString()} · {r.toneLabel} ({r.toneScore})</p>
            <div className="mt-1 flex flex-wrap gap-2">{r.conflictTags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
