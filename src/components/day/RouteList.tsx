import type { RoutePoint } from "@/lib/schema";
import { fmtM } from "@/lib/format";

export function RouteList({ points, lang = "fr" }: { points: RoutePoint[]; lang?: string }) {
  if (points.length === 0) return <p className="text-sm text-ink-3">경로 지점 확인 필요</p>;
  const peak = Math.max(...points.map((p) => p.altitudeM ?? Number.NEGATIVE_INFINITY));
  return (
    <ol className="flex flex-col gap-2.5 border-l-[3px] border-line pl-3.5 text-sm sm:grid sm:grid-cols-[repeat(auto-fit,minmax(104px,1fr))] sm:gap-2 sm:border-l-0 sm:pl-0 sm:text-[13px]">
      {points.map((p, i) => {
        const role = i === 0 ? "출발" : i === points.length - 1 ? "도착" : "경유";
        return (
          <li
            key={`${p.nameOriginal}-${i}`}
            className={`sm:border-t-[3px] sm:pt-2.5 ${p.altitudeM !== null && p.altitudeM === peak ? "sm:border-amber" : "sm:border-forest-900"}`}
          >
            <span className="font-bold sm:block sm:text-sm" lang={lang}>
              {p.nameOriginal}
            </span>{" "}
            <span className="text-ink-3">
              {p.altitudeM !== null ? fmtM(p.altitudeM) : "고도 확인 필요"} · {role}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
