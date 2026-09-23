const nf = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });
const nfInt = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const nfEur = new Intl.NumberFormat("ko-KR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function fmtKm(v: number): string {
  return `${nf.format(v)} km`;
}

export function fmtM(v: number, sign: "+" | "-" | "" = ""): string {
  return `${sign}${nfInt.format(v)} m`;
}

export function fmtEur(v: number): string {
  return `€${nfEur.format(v)}`;
}

export function fmtMoney(v: number, currency: "EUR" | "CHF"): string {
  return currency === "EUR" ? fmtEur(v) : `CHF ${nfEur.format(v)}`;
}

export const COUNTRY_LABEL: Record<string, string> = {
  FR: "프랑스 FR",
  IT: "이탈리아 IT",
  CH: "스위스 CH",
  KR: "한국 KR",
};

const COUNTRY_LANG: Record<string, string> = { FR: "fr", IT: "it", CH: "fr", KR: "ko" };

export function langFor(countries: readonly string[] | string): string {
  const first = Array.isArray(countries) ? countries[0] : countries;
  return (first && COUNTRY_LANG[first]) ?? "fr";
}

export const STATUS_LABEL: Record<string, string> = {
  confirmed: "확정",
  researched: "조사",
  estimated: "추정",
  needs_check: "재확인 필요",
};

export const MODE_LABEL: Record<string, string> = {
  flight: "항공",
  train: "기차",
  bus: "버스",
  walk: "도보",
  transfer: "이동",
  stay: "숙박",
  cablecar: "케이블카",
};
