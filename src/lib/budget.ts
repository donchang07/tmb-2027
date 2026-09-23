import { z } from "zod";
import { budgetItems, budgetMeta, exchangeRates } from "@/data/seed/budget";
import { BudgetItemSchema, BudgetMetaSchema, ExchangeRateSchema } from "@/lib/schema";
import type { BudgetItem, BudgetMeta, ExchangeRate } from "@/lib/schema";

export type BudgetTotals = {
  subtotalLow: number;
  subtotalMid: number;
  contingencyLow: number;
  contingencyMid: number;
  totalLow: number;
  totalMid: number;
  contingencyRate: number;
};

export type BudgetSummary = BudgetTotals & {
  inflationLow: number;
  inflationHigh: number;
  inflationYears: number;
  inflatedLow: number;
  inflatedHigh: number;
  recommendedLow: number;
  recommendedHigh: number;
  recommendedKrwManLow: number;
  recommendedKrwManHigh: number;
};

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function round1(n: number): number {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

export function computeBudget(items: BudgetItem[], rate: number): BudgetTotals {
  const subtotalLow = round2(items.reduce((acc, it) => acc + it.lowEur, 0));
  const subtotalMid = round2(items.reduce((acc, it) => acc + it.midEur, 0));
  const contingencyLow = round2(subtotalLow * rate);
  const contingencyMid = round2(subtotalMid * rate);
  return {
    subtotalLow,
    subtotalMid,
    contingencyLow,
    contingencyMid,
    totalLow: round2(subtotalLow + contingencyLow),
    totalMid: round2(subtotalMid + contingencyMid),
    contingencyRate: rate,
  };
}

export const DEFAULT_EUR_KRW = 1500;

export function toKrwMan(eur: number, eurKrw: number): number {
  return Math.round((eur * eurKrw) / 50000) * 5;
}

export function computeSummary(items: BudgetItem[], meta: BudgetMeta, rates: ExchangeRate[]): BudgetSummary {
  const totals = computeBudget(items, meta.contingencyRate);
  const eurKrw = rates.find((r) => r.pair === "EUR/KRW")?.rate ?? DEFAULT_EUR_KRW;
  return {
    ...totals,
    inflationLow: meta.inflationLow,
    inflationHigh: meta.inflationHigh,
    inflationYears: meta.inflationYears,
    inflatedLow: round1(totals.totalLow * (1 + meta.inflationLow) ** meta.inflationYears),
    inflatedHigh: round1(totals.totalMid * (1 + meta.inflationHigh) ** meta.inflationYears),
    recommendedLow: meta.recommendedLowEur,
    recommendedHigh: meta.recommendedHighEur,
    recommendedKrwManLow: toKrwMan(meta.recommendedLowEur, eurKrw),
    recommendedKrwManHigh: toKrwMan(meta.recommendedHighEur, eurKrw),
  };
}

let validated = false;

export function getBudget(): { items: BudgetItem[]; rates: ExchangeRate[]; meta: BudgetMeta; summary: BudgetSummary } {
  if (!validated) {
    z.array(BudgetItemSchema).parse(budgetItems);
    z.array(ExchangeRateSchema).parse(exchangeRates);
    BudgetMetaSchema.parse(budgetMeta);
    validated = true;
  }
  return { items: budgetItems, rates: exchangeRates, meta: budgetMeta, summary: computeSummary(budgetItems, budgetMeta, exchangeRates) };
}

export function isBudgetStale(meta: BudgetMeta, todayISO: string): boolean {
  return todayISO > meta.validUntil;
}

export function toKrw(eur: number, rates: ExchangeRate[]): number | null {
  const r = rates.find((x) => x.pair === "EUR/KRW");
  return r ? Math.round(eur * r.rate) : null;
}
