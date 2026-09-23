import type { Lodging } from "@/lib/schema";
import { type BookingStatus } from "@/lib/booking-status";
import { getContact } from "@/lib/itinerary";
import { fmtMoney, langFor } from "@/lib/format";
import { logEvent } from "@/lib/log";
import { Badge } from "@/components/ui/Badge";
import { BookingStatusBadge } from "@/components/pwa/BookingStatusBadge";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { StatusNote } from "@/components/ui/StatusNote";

const CHANNEL_LABEL: Record<Lodging["bookingChannel"], string> = { portal: "포털", own: "자체", other: "기타" };

export function LodgingCard({
  lodging,
  status,
  statusUpdatedAt,
  approvedAlternative = null,
}: {
  lodging: Lodging | undefined;
  status: BookingStatus;
  statusUpdatedAt: string | null;
  approvedAlternative?: string | null;
}) {
  if (!lodging) {
    return <StatusNote tone="warn" title="숙박 확인 필요">이 Day의 숙박 정보가 아직 등록되지 않았습니다.</StatusNote>;
  }
  const contact = getContact(lodging);
  const undecided = lodging.kind === "undecided";
  if (undecided) logEvent("lodging_undecided", "info", { lodgingId: lodging.id });
  else if (lodging.verifiedPhone === null) logEvent("lodging_phone_unverified", "warn", { lodgingId: lodging.id });
  if (status === "alternative") logEvent("lodging_unavailable", "warn", { lodgingId: lodging.id });

  const price =
    lodging.priceLow !== null
      ? lodging.priceHigh !== null && lodging.priceHigh !== lodging.priceLow
        ? `${fmtMoney(lodging.priceLow, lodging.currency)} ~ ${fmtMoney(lodging.priceHigh, lodging.currency)}`
        : fmtMoney(lodging.priceLow, lodging.currency)
      : "가격 확인 필요";

  return (
    <article className="card p-4" aria-labelledby={`lodging-${lodging.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`lodging-${lodging.id}`} className="text-lg font-bold" lang={langFor(lodging.country)}>
          {lodging.nameOriginal}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {undecided ? <Badge tone="warn">숙소 미정</Badge> : null}
          <BookingStatusBadge lodgingId={lodging.id} initialStatus={status} initialUpdatedAt={statusUpdatedAt} />
        </div>
      </div>
      <p className="text-sm text-rock">{lodging.location}</p>
      {undecided ? <p className="mt-2 text-sm">리더가 확정 예정 · 확정 후 링크·연락처가 표시됩니다</p> : null}
      {undecided && lodging.candidates.length > 0 ? (
        <div className="mt-2">
          <h4 className="text-sm font-semibold text-rock">후보 숙소</h4>
          <ol className="mt-1 space-y-1 text-sm">
            {lodging.candidates.map((c, i) => (
              <li key={c.name} className="flex gap-2">
                <span className="shrink-0 text-rock">{i + 1}.</span>
                <span>
                  <span className="font-medium" lang={langFor(lodging.country)}>
                    {c.name}
                  </span>
                  {c.stars ? <span className="text-rock"> · {c.stars}</span> : null}
                  {c.note ? <span className="text-rock"> — {c.note}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {status === "alternative" ? (
        <p className="mt-3 rounded-lg border border-safety/40 bg-safety/5 p-2 text-sm text-safety">
          대안 숙소 확인 필요 — {approvedAlternative ?? lodging.alternative ?? "승인된 대안을 리더에게 확인하세요."}
        </p>
      ) : null}

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-rock">가격</dt>
          <dd>
            {price} <span className="text-rock">· {lodging.season}</span>
          </dd>
        </div>
        {lodging.alternative && status !== "alternative" ? (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-rock">대안 숙소</dt>
            <dd>{lodging.alternative}</dd>
          </div>
        ) : null}
        {lodging.notes ? (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-rock">비고</dt>
            <dd>{lodging.notes}</dd>
          </div>
        ) : null}
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-rock">기준일</dt>
          <dd>{lodging.checkedAt}</dd>
        </div>
      </dl>

      {undecided ? null : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {lodging.bookingUrl ? (
            <ExternalLink href={lodging.bookingUrl} className="border border-alpine/30">
              공식 예약 ({CHANNEL_LABEL[lodging.bookingChannel]})
            </ExternalLink>
          ) : (
            <span className="text-sm text-amber-800">예약 링크 확인 필요</span>
          )}
          {contact.kind === "phone" && contact.value ? (
            <a href={`tel:${contact.value.replace(/\s+/g, "")}`} className="tap inline-flex items-center rounded-lg bg-alpine px-3 text-sm font-semibold text-white">
              전화 {contact.value}
            </a>
          ) : null}
          {contact.kind === "url" && contact.value ? (
            <ExternalLink href={contact.value} className="border border-alpine/30">
              공식 연락
            </ExternalLink>
          ) : null}
          {contact.kind === "none" ? <span className="text-sm text-amber-800">연락 수단 확인 필요</span> : null}
          {lodging.verifiedPhone === null ? <Badge tone="warn">전화 확인 필요</Badge> : null}
        </div>
      )}
    </article>
  );
}
