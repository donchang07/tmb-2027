import type { BudgetItem } from "@/lib/schema";
import type { BudgetSummary } from "@/lib/budget";
import { fmtEur } from "@/lib/format";

const FOOT_ROW = "flex items-baseline gap-3 py-3 sm:table-row sm:py-0";
const FOOT_NUM = "whitespace-nowrap text-right sm:py-3";
const TOTAL_CELL = "bg-forest-900 py-3.5 text-bone";

export function BudgetTable({ items, summary }: { items: BudgetItem[]; summary: BudgetSummary }) {
  return (
    <div className="card px-3.5 pb-3.5 pt-1 sm:px-6 sm:pb-5 sm:pt-2">
      <table className="block w-full text-sm sm:table sm:text-[15px]">
        <caption className="sr-only">항목별 1인 예산</caption>
        <thead className="text-left text-[13px] text-ink-3 max-sm:sr-only">
          <tr>
            <th scope="col" className="py-3.5 font-semibold">
              항목
            </th>
            <th scope="col" className="py-3.5 text-right font-semibold">
              저(€)
            </th>
            <th scope="col" className="py-3.5 pl-4 text-right font-semibold">
              중(€)
            </th>
            <th scope="col" className="hidden py-3.5 pl-5 font-semibold sm:table-cell">
              근거·비고
            </th>
          </tr>
        </thead>
        <tbody data-stagger className="block sm:table-row-group">
          {items.map((it) => (
            <tr key={it.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-line-soft py-3 align-top max-sm:[&:not(:first-child)]:border-t sm:table-row sm:border-t sm:py-0">
              <th scope="row" className="w-full text-left font-semibold sm:table-cell sm:w-auto sm:py-3 sm:pr-3">
                {it.category}
              </th>
              <td className="whitespace-nowrap text-right text-[13px] font-bold sm:table-cell sm:py-3 sm:text-[15px] sm:font-normal">
                <span aria-hidden="true" className="font-normal text-ink-3 sm:hidden">
                  저{" "}
                </span>
                {fmtEur(it.lowEur)}
              </td>
              <td className="whitespace-nowrap text-right text-[13px] font-bold sm:table-cell sm:py-3 sm:pl-4 sm:text-[15px] sm:font-normal">
                <span aria-hidden="true" className="font-normal text-ink-3 sm:hidden">
                  중{" "}
                </span>
                {fmtEur(it.midEur)}
              </td>
              <td className="block w-full text-xs leading-snug text-ink-3 sm:table-cell sm:w-auto sm:py-3 sm:pl-5 sm:text-[13px]">{it.basis}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="block sm:table-footer-group">
          <tr className={`${FOOT_ROW} border-t-2 border-forest-900`}>
            <th scope="row" className="flex-1 text-left sm:py-3">
              소계
            </th>
            <td className={FOOT_NUM}>{fmtEur(summary.subtotalLow)}</td>
            <td className={`${FOOT_NUM} sm:pl-4`}>{fmtEur(summary.subtotalMid)}</td>
            <td className="hidden sm:table-cell" />
          </tr>
          <tr className={`${FOOT_ROW} border-t border-line-soft`}>
            <th scope="row" className="flex-1 text-left font-semibold sm:py-3">
              예비비 {Math.round(summary.contingencyRate * 100)}%
            </th>
            <td className={FOOT_NUM}>{fmtEur(summary.contingencyLow)}</td>
            <td className={`${FOOT_NUM} sm:pl-4`}>{fmtEur(summary.contingencyMid)}</td>
            <td className="hidden pl-5 text-[13px] text-ink-3 sm:table-cell">만실 대체 숙소·우천 시 택시 등</td>
          </tr>
          <tr className="flex font-extrabold sm:table-row">
            <th scope="row" className={`${TOTAL_CELL} flex-1 rounded-l-[9px] px-3 text-left font-bold`}>
              합계(1인, 항공권 제외)
            </th>
            <td className={`${TOTAL_CELL} whitespace-nowrap pl-2 text-right text-base sm:text-[19px]`}>{fmtEur(summary.totalLow)}</td>
            <td className={`${TOTAL_CELL} whitespace-nowrap rounded-r-[9px] pl-3 pr-3 text-right text-base text-amber sm:rounded-none sm:pl-4 sm:pr-0 sm:text-[19px]`}>
              {fmtEur(summary.totalMid)}
            </td>
            <td className={`${TOTAL_CELL} hidden rounded-r-[9px] sm:table-cell`} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
