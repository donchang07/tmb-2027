import Link from "next/link";
import { visibleQuickLinks } from "@/lib/phases";

export function QuickLinks() {
  return (
    <nav aria-label="빠른 링크" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
      {visibleQuickLinks().map((l) => (
        <Link key={l.href} href={l.href} className="card tap flex flex-col justify-center p-4 hover:border-alpine">
          <span className="text-base font-bold text-alpine">{l.label}</span>
          <span className="text-xs text-rock">{l.desc}</span>
        </Link>
      ))}
    </nav>
  );
}
