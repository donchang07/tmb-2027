import type { TravelLeg } from "@/lib/schema";
import { MODE_LABEL, STATUS_LABEL } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "@/components/ui/ExternalLink";

export function LegTimeline({ legs }: { legs: TravelLeg[] }) {
  return (
    <ol data-testid="leg-timeline" className="relative space-y-4 border-l-2 border-alpine/30 pl-5">
      {legs.map((leg) => (
        <li key={leg.id} className="relative">
          <span aria-hidden="true" className="absolute -left-[27px] top-2 h-3 w-3 rounded-full bg-alpine" />
          <article className="card p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge tone="alpine">{MODE_LABEL[leg.mode] ?? leg.mode}</Badge>
              <Badge tone={leg.verificationStatus === "confirmed" ? "success" : leg.verificationStatus === "needs_check" ? "warn" : "neutral"}>
                {STATUS_LABEL[leg.verificationStatus]}
              </Badge>
              <span className="text-xs text-rock">기준일 {leg.checkedAt}</span>
            </div>
            <h3 className="mt-2 font-bold">
              {leg.originKo} → {leg.destinationKo}
            </h3>
            <p className="text-sm text-rock">
              {leg.originOriginal} → {leg.destinationOriginal}
            </p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg bg-snow p-2">
                <dt className="text-[11px] text-rock">출발</dt>
                <dd className="font-bold">{leg.departAt ?? "시간 확인 필요"}</dd>
              </div>
              <div className="rounded-lg bg-snow p-2">
                <dt className="text-[11px] text-rock">도착</dt>
                <dd className="font-bold">{leg.arriveAt ?? "시간 확인 필요"}</dd>
              </div>
              <div className="rounded-lg bg-snow p-2">
                <dt className="text-[11px] text-rock">소요</dt>
                <dd className="font-bold">{leg.duration}</dd>
              </div>
            </dl>
            {leg.notes ? <p className="mt-2 text-sm text-rock">{leg.notes}</p> : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {leg.bookingUrl ? <ExternalLink href={leg.bookingUrl}>예매 링크</ExternalLink> : <span className="text-sm text-rock">예매 링크 없음</span>}
            </div>
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-900">
              <span className="font-semibold">지연 시 대안:</span> {leg.fallback}
            </p>
          </article>
        </li>
      ))}
    </ol>
  );
}
