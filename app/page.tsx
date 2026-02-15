import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
        <h1 className="text-4xl font-bold">TalkThermo</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">텍스트/캡쳐/음성 입력을 정리해서, 오해를 줄이는 다음 메시지를 제안해요.</p>
        <Link href="/analyze" className="mt-5 inline-block"><Button size="lg">분석 시작하기</Button></Link>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["멀티모달 입력", "텍스트 · OCR · 음성을 하나의 분석 파이프라인으로 처리"],
          ["신중한 코칭", "'처럼 들릴 수 있어요' 표현을 기반으로 단정 없이 안내"],
          ["메타데이터 저장", "원문 저장 없이 점수/태그 중심으로 패턴 대시보드 제공"]
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
