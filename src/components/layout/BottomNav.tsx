import Link from "next/link";

const ITEMS = [
  { href: "/", label: "홈" },
  { href: "/itinerary", label: "일정" },
  { href: "/budget", label: "예산" },
  { href: "/map", label: "지도" },
  { href: "/packing", label: "준비물" },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-rock/20 bg-white/95 backdrop-blur sm:hidden"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="tap flex h-14 flex-col items-center justify-center text-xs font-medium text-rock hover:text-alpine"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
