import type { RoutePoint } from "@/lib/schema";
import { fmtM } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

export function RouteList({ points, lang = "fr" }: { points: RoutePoint[]; lang?: string }) {
  if (points.length === 0) return <p className="text-sm text-rock">경로 지점 확인 필요</p>;
  return (
    <ol className="relative space-y-3 border-l-2 border-alpine/30 pl-5">
      {points.map((p, i) => {
        const role = i === 0 ? "출발" : i === points.length - 1 ? "도착" : "경유";
        return (
          <li key={`${p.nameOriginal}-${i}`} className="relative">
            <span aria-hidden="true" className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ${role === "경유" ? "bg-rock" : "bg-alpine"}`} />
            <div className="flex flex-wrap items-baseline gap-2">
              <Badge tone={role === "경유" ? "neutral" : "alpine"}>{role}</Badge>
              <span className="font-semibold" lang={lang}>
                {p.nameOriginal}
              </span>
              <span className="ml-auto text-sm font-medium">{p.altitudeM !== null ? fmtM(p.altitudeM) : "고도 확인 필요"}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
