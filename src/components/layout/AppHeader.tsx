import Link from "next/link";
import { AccountMenu } from "@/components/layout/AccountMenu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-rock/20 bg-snow/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link href="/" className="tap flex items-center gap-2 font-bold text-alpine" aria-label="TMB 2027 홈">
          <span className="text-lg">TMB 2027</span>
          <span className="hidden text-sm font-normal text-rock sm:inline">걸어야 산다!</span>
        </Link>
        <div className="flex items-center gap-1">
          <nav aria-label="보조 메뉴" className="hidden gap-1 sm:flex">
            <Link href="/itinerary" className="tap flex items-center px-3 text-sm text-rock hover:text-alpine">
              일정
            </Link>
            <Link href="/budget" className="tap flex items-center px-3 text-sm text-rock hover:text-alpine">
              예산
            </Link>
            <Link href="/map" className="tap flex items-center px-3 text-sm text-rock hover:text-alpine">
              지도
            </Link>
            <Link href="/packing" className="tap flex items-center px-3 text-sm text-rock hover:text-alpine">
              준비물
            </Link>
            <Link href="/admin" className="tap flex items-center px-3 text-sm text-rock hover:text-alpine">
              관리자
            </Link>
          </nav>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
