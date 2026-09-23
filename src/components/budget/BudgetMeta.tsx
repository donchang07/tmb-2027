import type { BudgetMeta as BudgetMetaType, ExchangeRate } from "@/lib/schema";
import type { BudgetSummary } from "@/lib/budget";
import { fmtEur } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

const krw = new Intl.NumberFormat("ko-KR");
const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵"];

export function BudgetMeta({
  meta,
  rates,
  summary,
  stale,
}: {
  meta: BudgetMetaType;
  rates: ExchangeRate[];
  summary: BudgetSummary;
  stale: boolean;
}) {
  const years = SUP[summary.inflationYears] ?? `^${summary.inflationYears}`;
  const eurKrw = rates.find((r) => r.pair === "EUR/KRW");
  return (
    <div className="space-y-4">
      <section className="card p-4" aria-labelledby="rate-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="rate-heading" className="font-bold">
            환율·기준일
          </h2>
          <Badge tone={stale ? "warn" : "success"}>{stale ? "재확인 필요" : "기준일 유효"}</Badge>
        </div>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {rates.map((r) => (
            <div key={r.pair} className="flex justify-between rounded-lg bg-snow px-3 py-2">
              <dt className="text-rock">{r.pair}</dt>
              <dd className="font-semibold">
                {krw.format(r.rate)} <span className="text-xs font-normal text-rock">({r.checkedAt})</span>
              </dd>
            </div>
          ))}
          <div className="flex justify-between rounded-lg bg-snow px-3 py-2">
            <dt className="text-rock">예산 기준일</dt>
            <dd className="font-semibold">{meta.checkedAt}</dd>
          </div>
          <div className="flex justify-between rounded-lg bg-snow px-3 py-2">
            <dt className="text-rock">재확인 기한</dt>
            <dd className="font-semibold">{meta.validUntil}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-rock">표시 통화 EUR. CHF 항목은 1 CHF = 1.07 EUR로 환산된 근거값. 결제 전 재확인.</p>
      </section>

      <section className="card border-l-4 border-l-alpine p-4" aria-labelledby="reco-heading">
        <h2 id="reco-heading" className="font-bold">
          권장 준비 금액 (1인)
        </h2>
        <p className="mt-1 text-2xl font-black text-alpine">
          {fmtEur(summary.recommendedLow)} ~ {fmtEur(summary.recommendedHigh)}
        </p>
        <p className="text-sm text-rock">
          약 {krw.format(summary.recommendedKrwManLow)}만~{krw.format(summary.recommendedKrwManHigh)}만 원 (1 EUR ≈{" "}
          {krw.format(eurKrw?.rate ?? 0)}원)
        </p>
        <p className="mt-2 text-xs text-rock">
          저 {fmtEur(summary.totalLow)} × {1 + summary.inflationLow}
          {years} ≈ {fmtEur(Math.round(summary.inflatedLow))} → {fmtEur(summary.recommendedLow)} · 중{" "}
          {fmtEur(summary.totalMid)} × {1 + summary.inflationHigh}
          {years} ≈ {fmtEur(Math.round(summary.inflatedHigh))} → {fmtEur(summary.recommendedHigh)} (반올림 여유)
        </p>
        <p className="mt-1 text-xs text-rock">
          {rates.map((r) => `${r.pair} ${krw.format(r.rate)}`).join(" · ")}
          {rates[0] ? ` · 기준일 ${rates[0].checkedAt}` : null}
        </p>
      </section>

      <section className="card p-4" aria-labelledby="assump-heading">
        <h2 id="assump-heading" className="font-bold">
          산정 가정
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {meta.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>

      <section className="card p-4" aria-labelledby="notes-heading">
        <h2 id="notes-heading" className="font-bold">
          참고
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {meta.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
