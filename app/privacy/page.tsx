import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Privacy First 정책</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>TalkThermo는 기본적으로 저장 기능이 OFF이며, 서버/클라이언트에 원문 대화 텍스트를 저장하지 않습니다.</p>
        <p>Save ON일 때도 저장되는 항목은 톤 점수, 태그, 관계 유형 같은 메타데이터뿐입니다.</p>
        <p>분석 결과의 인용/근거는 20자 이하로 제한하여 원문 재식별 가능성을 줄입니다.</p>
        <p>실명과 민감정보 입력은 금지합니다.</p>
      </CardContent>
    </Card>
  );
}
