"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="p-10">
        <h1 className="text-2xl font-bold">문제가 발생했어요</h1>
        <p className="mt-2 text-muted-foreground">잠시 후 다시 시도하거나 홈으로 이동해 주세요.</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={reset}>다시 시도</Button>
          <Link href="/"><Button variant="outline">홈으로</Button></Link>
        </div>
      </body>
    </html>
  );
}
