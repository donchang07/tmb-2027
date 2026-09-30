"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "홈" },
  { href: "/itinerary", label: "일정" },
  { href: "/budget", label: "예산" },
  { href: "/map", label: "지도" },
  { href: "/packing", label: "준비물" },
] as const;

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/itinerary") return pathname.startsWith("/itinerary") || pathname.startsWith("/day/") || pathname.startsWith("/travel/");
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line-header bg-white px-1 pb-[env(safe-area-inset-bottom)] pt-1.5 sm:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`tap flex h-[52px] flex-col items-center gap-1.5 pt-1 text-[13px] transition-transform duration-150 ease-out active:scale-[0.97] ${
                  active ? "font-bold text-forest-900" : "font-semibold text-ink-3"
                }`}
              >
                <span aria-hidden="true" className={`h-[3px] w-6 rounded-sm ${active ? "bg-amber" : ""}`} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
