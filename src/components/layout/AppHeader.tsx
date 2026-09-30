import Link from "next/link";
import { AccountMenu } from "@/components/layout/AccountMenu";

const LINKS = [
  { href: "/itinerary", label: "일정" },
  { href: "/budget", label: "예산" },
  { href: "/map", label: "지도" },
  { href: "/packing", label: "준비물" },
  { href: "/admin", label: "관리자" },
] as const;

export function AppHeader() {
  return (
    <header className="relative bg-bone sm:border-b sm:border-line-header">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between gap-3 px-[18px] sm:h-[68px] sm:px-10">
        <Link href="/" className="tap flex items-baseline gap-3 self-center" aria-label="TMB 2027 홈">
          <span className="whitespace-nowrap text-lg font-extrabold tracking-[-0.02em] sm:text-xl">TMB 2027</span>
          <span className="hidden whitespace-nowrap text-sm text-ink-3 md:inline">걸어야 산다!</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <nav aria-label="보조 메뉴" className="hidden items-center gap-1 sm:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="tap ix-link flex items-center justify-center px-2.5 text-[15px] font-medium text-ink-2">
                {l.label}
              </Link>
            ))}
          </nav>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
