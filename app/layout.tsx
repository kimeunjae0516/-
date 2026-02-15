import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalkThermo v3",
  description: "대화 온도 체크 & 복기 코치"
};

const links = [
  ["/", "홈"],
  ["/analyze", "분석"],
  ["/history", "기록"],
  ["/patterns", "패턴"],
  ["/privacy", "프라이버시"]
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-slate-50/50">
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold">TalkThermo</Link>
            <div className="flex gap-4 text-sm">
              {links.map(([href, label]) => (
                <Link key={href} href={href} className="rounded px-2 py-1 text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500">
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
