import type { Metadata } from "next";
import { BudgetTable } from "@/components/budget/BudgetTable";
import { BudgetMeta } from "@/components/budget/BudgetMeta";
import { StatusNote } from "@/components/ui/StatusNote";
import { Photo } from "@/components/ui/Photo";
import { PHOTOS } from "@/lib/photos";
import { getBudget, isBudgetStale } from "@/lib/budget";
import { toLocalDateISO } from "@/lib/dates";
import { logEvent } from "@/lib/log";

export const metadata: Metadata = { title: "예산 — TMB 2027" };
export const dynamic = "force-dynamic";

export default function BudgetPage() {
  const { items, rates, meta, summary } = getBudget();
  const stale = isBudgetStale(meta, toLocalDateISO(new Date()));
  if (stale) logEvent("budget_stale", "warn", { validUntil: meta.validUntil });

  return (
    <div className="flex flex-col gap-3.5 sm:gap-5">
      <header className="grid gap-3.5 sm:grid-cols-2 sm:items-center sm:gap-10">
        <Photo src={PHOTOS.budget} className="h-[150px] sm:order-2 sm:h-[220px]" />
        <div>
          <h1 data-enter="1" className="text-[28px] font-extrabold leading-tight tracking-[-0.035em] sm:text-[36px] lg:text-[44px]">
            예산 (1인, 항공권 제외)
          </h1>
          <p className="mt-1 text-sm text-ink-2 sm:mt-2 sm:text-[17px]">저/중 범위 · EUR 기준 · 항목 합산 자동 계산</p>
        </div>
      </header>

      {stale ? (
        <StatusNote tone="warn" title="금액을 다시 확인해 주세요">
          재확인 기한({meta.validUntil})이 지났습니다. 아래 값은 {meta.checkedAt} 기준 참고용입니다.
        </StatusNote>
      ) : null}

      <div className="grid gap-3.5 sm:gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start lg:gap-5">
        {items.length === 0 ? (
          <StatusNote tone="error" title="계산 불가 — 예산 항목이 없습니다">
            예산 seed를 확인해 주세요.
          </StatusNote>
        ) : (
          <BudgetTable items={items} summary={summary} />
        )}

        <BudgetMeta meta={meta} rates={rates} summary={summary} stale={stale} />
      </div>
    </div>
  );
}
