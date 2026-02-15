"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";

export function PatternsClient() {
  const { records, people, load } = useAppStore();
  const [personId, setPersonId] = useState("");
  useEffect(() => { load(); }, [load]);

  const target = useMemo(() => records.filter((r) => (personId ? r.personId === personId : true)), [records, personId]);
  const trend = target.map((r) => ({ date: new Date(r.createdAt).toLocaleDateString(), tone: r.toneScore }));
  const tagData = Object.entries(target.flatMap((r) => r.conflictTags).reduce<Record<string, number>>((acc, tag) => ({ ...acc, [tag]: (acc[tag] ?? 0) + 1 }), {})).map(([tag, count]) => ({ tag, count }));
  const styleData = Object.entries(target.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.selectedSuggestionStyle ?? "미선택"]: (acc[r.selectedSuggestionStyle ?? "미선택"] ?? 0) + 1 }), {})).map(([name, value]) => ({ name, value }));

  const insight = target.length < 3
    ? "데이터가 적어 단정하기 어렵지만, 기록을 늘리면 반응 경향을 더 안정적으로 볼 수 있어요."
    : `최근 기록에서 평균 톤 점수는 ${Math.round(target.reduce((a, c) => a + c.toneScore, 0) / target.length)}점으로 보여요. 상황에 따라 방어적으로 들릴 가능성을 점검해 보세요.`;

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle>대상 선택</CardTitle></CardHeader><CardContent><select className="rounded border p-2" value={personId} onChange={(e) => setPersonId(e.target.value)}><option value="">전체</option>{people.map((p) => <option key={p.id} value={p.id}>{p.nickname}</option>)}</select></CardContent></Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>톤 점수 추세</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0,100]} /><Tooltip /><Line dataKey="tone" stroke="#4f46e5" /></LineChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>갈등 태그 TOP</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={tagData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="tag" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#0ea5e9" /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card className="lg:col-span-2"><CardHeader><CardTitle>제안 스타일 분포</CardTitle></CardHeader><CardContent className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={styleData} dataKey="value" nameKey="name" outerRadius={100}>{styleData.map((_, idx) => <Cell key={idx} fill={["#34d399", "#60a5fa", "#fbbf24", "#d1d5db"][idx % 4]} />)}</Pie><Legend /><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>내 반응 패턴</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{insight}</CardContent></Card>
    </div>
  );
}
