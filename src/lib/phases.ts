import { logEvent } from "@/lib/log";

export type NavKey = "itinerary" | "budget" | "map" | "packing" | "journal";

export const RELEASED: Record<NavKey, boolean> = {
  itinerary: true,
  budget: true,
  map: true,
  packing: true,
  journal: true,
};

export const QUICK_LINKS = [
  { key: "itinerary", href: "/itinerary", label: "일정", desc: "15일 전체" },
  { key: "budget", href: "/budget", label: "예산", desc: "1인 저/중" },
  { key: "map", href: "/map", label: "지도", desc: "12구간 개요" },
  { key: "packing", href: "/packing", label: "준비물", desc: "체크리스트" },
  { key: "journal", href: "/journal", label: "기록", desc: "팀 타임라인" },
] as const satisfies readonly { key: NavKey; href: string; label: string; desc: string }[];

export type QuickLink = (typeof QUICK_LINKS)[number];

export function visibleQuickLinks(
  released: Record<NavKey, boolean> = RELEASED,
  log: typeof logEvent = logEvent,
): readonly QuickLink[] {
  return QUICK_LINKS.filter((l) => {
    if (released[l.key]) return true;
    log("nav_hidden_by_phase", "info", { key: l.key });
    return false;
  });
}
