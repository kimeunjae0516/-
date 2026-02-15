"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AnalyzeError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Analyze route error", error);
  }, [error]);

  return (
    <div className="rounded-2xl border bg-white p-8">
      <h2 className="text-2xl font-semibold">분석 화면에서 오류가 발생했어요</h2>
      <p className="mt-2 text-muted-foreground">잠시 후 다시 시도해 주세요. 문제가 반복되면 입력을 짧게 나눠 주세요.</p>
      <Button className="mt-4" onClick={reset}>다시 시도</Button>
    </div>
  );
}
