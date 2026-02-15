import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-sky-100 via-indigo-50 to-violet-100 p-8 shadow-sm">
        <p className="text-sm font-medium text-indigo-600">TalkThermo v3</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">대화 온도 체크 & 복기 코치</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">텍스트, 캡쳐 OCR, 음성으로 입력하고 오해 가능성을 점검해요. 상대를 단정하지 않는 코칭만 제공합니다.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/analyze"><Button size="lg">분석 시작</Button></Link>
          <Link href="/privacy"><Button variant="outline" size="lg">개인정보 원칙 보기</Button></Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>3가지 입력</CardTitle><CardDescription>텍스트 / 캡쳐(OCR) / 음성(STT) 후 편집 가능</CardDescription></CardHeader><CardContent className="text-xs text-muted-foreground">분석 전 원문을 직접 다듬어 정확도를 높일 수 있어요.</CardContent></Card>
        <Card><CardHeader><CardTitle>Privacy First</CardTitle><CardDescription>저장 기본 OFF, 원문 저장 금지</CardDescription></CardHeader><CardContent className="text-xs text-muted-foreground">Save ON이어도 메타데이터만 저장해요.</CardContent></Card>
        <Card><CardHeader><CardTitle>패턴 대시보드</CardTitle><CardDescription>톤 추세·충돌 태그를 장기적으로 복기</CardDescription></CardHeader><CardContent className="text-xs text-muted-foreground">사람을 낙인찍지 않는 표현으로 인사이트를 제공합니다.</CardContent></Card>
      </section>
    </div>
  );
}
