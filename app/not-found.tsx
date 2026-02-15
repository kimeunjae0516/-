import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-2xl border p-10 text-center">
      <h2 className="text-2xl font-semibold">페이지를 찾을 수 없어요</h2>
      <p className="mt-2 text-muted-foreground">주소를 확인하거나 홈에서 다시 시작해 주세요.</p>
      <Link href="/" className="mt-4 inline-block text-indigo-600 underline">홈으로 이동</Link>
    </div>
  );
}
