import type { BudgetItem } from "@/lib/schema";
import type { BudgetSummary } from "@/lib/budget";
import { fmtEur } from "@/lib/format";

export function BudgetTable({ items, summary }: { items: BudgetItem[]; summary: BudgetSummary }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <caption className="sr-only">항목별 1인 예산</caption>
        <thead className="bg-snow text-left text-xs text-rock">
          <tr>
            <th scope="col" className="px-3 py-2">
              항목
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              저(€)
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              중(€)
            </th>
            <th scope="col" className="hidden px-3 py-2 sm:table-cell">
              근거·비고
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="flex flex-wrap border-t border-rock/10 align-top sm:table-row">
              <th scope="row" className="flex-1 px-3 py-2 text-left font-medium sm:table-cell">
                {it.category}
              </th>
              <td className="px-3 py-2 text-right sm:table-cell">{fmtEur(it.lowEur)}</td>
              <td className="px-3 py-2 text-right sm:table-cell">{fmtEur(it.midEur)}</td>
              <td className="block w-full px-3 pb-2 text-xs text-rock sm:table-cell sm:w-auto sm:py-2">{it.basis}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-rock/30 bg-snow">
          <tr>
            <th scope="row" className="px-3 py-2 text-left">
              소계
            </th>
            <td className="px-3 py-2 text-right">{fmtEur(summary.subtotalLow)}</td>
            <td className="px-3 py-2 text-right">{fmtEur(summary.subtotalMid)}</td>
            <td className="hidden sm:table-cell" />
          </tr>
          <tr>
            <th scope="row" className="px-3 py-2 text-left">
              예비비 {Math.round(summary.contingencyRate * 100)}%
            </th>
            <td className="px-3 py-2 text-right">{fmtEur(summary.contingencyLow)}</td>
            <td className="px-3 py-2 text-right">{fmtEur(summary.contingencyMid)}</td>
            <td className="hidden px-3 py-2 text-xs text-rock sm:table-cell">만실 대체 숙소·우천 시 택시 등</td>
          </tr>
          <tr className="text-base font-bold text-alpine">
            <th scope="row" className="px-3 py-3 text-left">
              합계(1인, 항공권 제외)
            </th>
            <td className="px-3 py-3 text-right">{fmtEur(summary.totalLow)}</td>
            <td className="px-3 py-3 text-right">{fmtEur(summary.totalMid)}</td>
            <td className="hidden sm:table-cell" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
