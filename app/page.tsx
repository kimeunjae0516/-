import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
        <h1 className="text-4xl font-bold">대화 온도 체크 & 복기 코치</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">상대를 단정하지 않고, 오해를 줄이는 안전한 다음 문장을 제안합니다.</p>
        <Link href="/analyze" className="mt-5 inline-block"><Button size="lg">지금 분석 시작</Button></Link>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["입력 3가지", "이미지 OCR, 텍스트 복붙, 상황설명 모드를 지원합니다."],
          ["안전한 분석", "의도 단정 금지 원칙과 완화된 표현으로 결과를 제공합니다."],
          ["패턴 대시보드", "저장 ON일 때 추세/태그/나의 반복 패턴을 확인합니다."]
        ].map(([title, desc]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{desc}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </section>
    </div>
  );
}
