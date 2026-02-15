import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <Card>
      <CardHeader><CardTitle>개인정보/저장 정책</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>기본값은 기록 저장 OFF이며, 서버에 원문 대화를 저장하지 않습니다.</p>
        <p>저장 ON 시에도 분석 요약/점수/태그 등 메타데이터만 로컬 저장합니다.</p>
        <p>위기 상황 또는 고강도 갈등은 전문 기관/전문가의 도움을 권장합니다.</p>
      </CardContent>
    </Card>
  );
}
