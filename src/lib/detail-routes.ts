import { days } from "@/data/seed/days";
import { travelLegs } from "@/data/seed/travel-legs";

const trekDayIds = new Set(days.filter((d) => d.type === "trek").map((d) => d.id));
const travelDayIds = new Set(travelLegs.map((l) => l.dayId).filter((id) => days.some((d) => d.id === id)));

export function isMissingDetailPath(pathname: string): boolean {
  const m = pathname.match(/^\/(day|travel|journal)\/([^/]+)\/?$/);
  const section = m?.[1];
  const id = m?.[2];
  if (!section || !id) return false;
  if (section === "journal" && id === "login") return false;
  return !(section === "travel" ? travelDayIds : trekDayIds).has(id);
}
