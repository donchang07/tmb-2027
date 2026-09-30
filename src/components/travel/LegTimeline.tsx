import type { TravelLeg } from "@/lib/schema";
import { MODE_LABEL, STATUS_LABEL } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "@/components/ui/ExternalLink";

export function LegTimeline({ legs }: { legs: TravelLeg[] }) {
  return (
    <ol data-testid="leg-timeline" data-stagger className="flex flex-col">
      {legs.map((leg, i) => (
        <li key={leg.id} className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 sm:grid-cols-[28px_minmax(0,1fr)] sm:gap-4">
          <div aria-hidden="true" className="flex flex-col items-center">
            <span className="mt-[3px] h-3 w-3 flex-none rounded-[50%] border-[3px] border-forest-900 bg-white sm:mt-1 sm:h-3.5 sm:w-3.5" />
            {i < legs.length - 1 ? <span className="w-0.5 flex-1 bg-line" /> : null}
          </div>
          <article className={`flex min-w-0 flex-col gap-1.5 sm:gap-2 ${i < legs.length - 1 ? "pb-[18px] sm:pb-[22px]" : ""}`}>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="sage">{MODE_LABEL[leg.mode] ?? leg.mode}</Badge>
              <Badge tone={leg.verificationStatus === "confirmed" ? "success" : leg.verificationStatus === "needs_check" ? "warn" : "outline"}>
                {STATUS_LABEL[leg.verificationStatus]}
              </Badge>
              <span className="whitespace-nowrap text-xs text-ink-3">기준일 {leg.checkedAt}</span>
            </div>
            <h3 className="text-[15px] font-bold sm:text-[17px]">
              {leg.originKo} → {leg.destinationKo}
            </h3>
            <p className="text-[13px] text-ink-3 sm:text-sm">
              {leg.originOriginal} → {leg.destinationOriginal}
            </p>
            <dl className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] sm:gap-x-7 sm:text-sm">
              <div className="flex gap-1.5">
                <dt className="whitespace-nowrap text-ink-3">출발</dt>
                <dd className="font-bold">{leg.departAt ?? "시간 확인 필요"}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="whitespace-nowrap text-ink-3">도착</dt>
                <dd className="font-bold">{leg.arriveAt ?? "시간 확인 필요"}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="whitespace-nowrap text-ink-3">소요</dt>
                <dd className="font-bold">{leg.duration}</dd>
              </div>
            </dl>
            {leg.notes ? <p className="text-[13px] leading-[1.55] text-ink-2 sm:text-sm">{leg.notes}</p> : null}
            <div className="flex flex-wrap items-center gap-2">
              {leg.bookingUrl ? <ExternalLink href={leg.bookingUrl}>예매 링크</ExternalLink> : <span className="text-[13px] text-ink-3 sm:text-sm">예매 링크 없음</span>}
            </div>
            <p className="text-[13px] leading-[1.55] text-ink-3 sm:text-sm">
              <span className="font-semibold text-ink-2">지연 시 대안:</span> {leg.fallback}
            </p>
          </article>
        </li>
      ))}
    </ol>
  );
}
