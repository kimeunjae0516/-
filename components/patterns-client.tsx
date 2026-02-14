"use client";

import { useEffect, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PatternsClient() {
  const { records, load } = useAppStore();
  useEffect(() => { load(); }, [load]);

  const trend = records.slice().reverse().map((r) => ({ date: new Date(r.createdAt).toLocaleDateString(), score: r.toneScore }));
  const tagData = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach((r) => r.conflictTags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    return [...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [records]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>톤 점수 추세</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 100]} /><Tooltip /><Line type="monotone" dataKey="score" stroke="#2563eb" /></LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>자주 뜨는 갈등 태그</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tagData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="tag" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#4f46e5" /></BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>내 반복 패턴 & 다음 액션</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>분석된 언어 신호 기반으로 추정한 요약입니다. 상대의 의도/심리를 단정하지 않습니다.</p>
          <ul className="mt-2 list-disc pl-5">
            <li>요청 전 사과 표현이 잦다면: “부담 주려는 건 아니고, 가능한 범위를 알려줘.”</li>
            <li>감정 숨김 경향이 있다면: “지금은 조금 서운해서, 내 의도를 먼저 설명할게.”</li>
            <li>경계 설정 필요 시: “이 표현은 내가 방어적으로 들려서, 다른 방식으로 말해주면 좋겠어.”</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
