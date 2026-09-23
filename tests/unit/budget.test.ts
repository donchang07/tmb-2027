import { describe, expect, it } from "vitest";
import { computeBudget, getBudget, isBudgetStale, round2, toKrw, toKrwMan } from "@/lib/budget";
import type { BudgetItem } from "@/lib/schema";

describe("budget arithmetic (FR-006, SC-003)", () => {
  it("seed passes validation and has 9 items", () => {
    const { items, rates } = getBudget();
    expect(items).toHaveLength(10);
    expect(items.at(-1)?.id).toBe("aiguille-du-midi");
    expect(items.at(-1)?.lowEur).toBe(60);
    expect(items.at(-1)?.midEur).toBe(83);
    expect(items.at(-1)?.basis).toContain("2026 동적 요금");
    expect(rates.map((r) => r.pair).sort()).toEqual(["CHF/EUR", "EUR/KRW", "USD/EUR"]);
  });

  it("subtotal / contingency / total match appendix D-1", () => {
    const { summary } = getBudget();
    expect(summary.subtotalLow).toBe(1560);
    expect(summary.subtotalMid).toBe(2430);
    expect(summary.contingencyLow).toBe(156);
    expect(summary.contingencyMid).toBe(243);
    expect(summary.totalLow).toBe(1716);
    expect(summary.totalMid).toBe(2673);
  });

  it("inflation-adjusted values sit just below the recommended constants", () => {
    const { summary } = getBudget();
    expect(summary.inflationLow).toBe(0.03);
    expect(summary.inflationHigh).toBe(0.05);
    expect(summary.inflationYears).toBe(2);
    expect(summary.inflatedLow).toBeCloseTo(1716 * 1.03 ** 2, 1);
    expect(summary.inflatedHigh).toBeCloseTo(2673 * 1.05 ** 2, 1);
    expect(summary.recommendedLow).toBe(1900);
    expect(summary.recommendedHigh).toBe(3000);
    expect(summary.inflatedLow).toBeLessThanOrEqual(summary.recommendedLow);
    expect(summary.recommendedLow).toBeLessThanOrEqual(summary.inflatedLow + 100);
    expect(summary.inflatedHigh).toBeLessThanOrEqual(summary.recommendedHigh);
    expect(summary.recommendedHigh).toBeLessThanOrEqual(summary.inflatedHigh + 100);
  });

  it("toKrwMan rounds to 5만원 units", () => {
    const { summary } = getBudget();
    expect(toKrwMan(1900, 1500)).toBe(285);
    expect(toKrwMan(3000, 1500)).toBe(450);
    expect(summary.recommendedKrwManLow).toBe(285);
    expect(summary.recommendedKrwManHigh).toBe(450);
  });

  it("recomputed item sums equal subtotals within €1", () => {
    const { items, summary } = getBudget();
    const low = items.reduce((a, i) => a + i.lowEur, 0);
    const mid = items.reduce((a, i) => a + i.midEur, 0);
    expect(Math.abs(low - summary.subtotalLow)).toBeLessThanOrEqual(1);
    expect(Math.abs(mid - summary.subtotalMid)).toBeLessThanOrEqual(1);
    expect(Math.abs(summary.totalLow - low * 1.1)).toBeLessThanOrEqual(1);
    expect(Math.abs(summary.totalMid - mid * 1.1)).toBeLessThanOrEqual(1);
  });

  it("round2 and fractional contingency stay within 0.01", () => {
    expect(round2(10.005)).toBe(10.01);
    expect(round2(1.005)).toBe(1.01);
    const items: BudgetItem[] = [
      { id: "a", category: "a", lowEur: 10.005, midEur: 20.004, basis: "b", sourceCheckedAt: "2026-09-09" },
      { id: "b", category: "b", lowEur: 0.1, midEur: 0.2, basis: "b", sourceCheckedAt: "2026-09-09" },
    ];
    const s = computeBudget(items, 0.1);
    expect(Math.abs(s.totalLow - round2((10.005 + 0.1) * 1.1))).toBeLessThanOrEqual(0.01);
    expect(Math.abs(s.totalMid - round2((20.004 + 0.2) * 1.1))).toBeLessThanOrEqual(0.01);
  });

  it("isBudgetStale flips the day after validUntil", () => {
    const { meta } = getBudget();
    expect(isBudgetStale(meta, meta.validUntil)).toBe(false);
    expect(isBudgetStale(meta, "2027-04-01")).toBe(true);
    expect(isBudgetStale(meta, "2026-09-16")).toBe(false);
  });

  it("toKrw uses EUR/KRW rate", () => {
    const { rates } = getBudget();
    expect(toKrw(1716, rates)).toBe(2574000);
    expect(toKrw(1716, [])).toBeNull();
  });
});
