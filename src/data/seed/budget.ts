import type { BudgetItem, BudgetMeta, ExchangeRate } from "@/lib/schema";

const CHECKED = "2026-09-09";
const RECHECKED = "2026-09-16";
const V3_CHECKED = "2026-09-18";

export const budgetItems: BudgetItem[] = [
  {
    id: "train-zrh-gva",
    category: "ZRH↔GVA 기차 왕복(2등석)",
    lowEur: 70,
    midEur: 132,
    basis: "정가 약 CHF 88~90/편도, Supersaver CHF 26~29부터(6개월 전 판매), 10인 이상 단체권 30% 할인 → 저=Supersaver, 중=단체권",
    sourceCheckedAt: CHECKED,
  },
  {
    id: "bus-gva-cha",
    category: "제네바↔샤모니 버스 왕복",
    lowEur: 40,
    midEur: 80,
    basis: "FlixBus·BlaBlaCar €12~27/편도, 공유셔틀(Alpybus·Mountain Drop-offs) €30~45/편도",
    sourceCheckedAt: CHECKED,
  },
  {
    id: "valley-transit",
    category: "샤모니 계곡 교통(샤모니↔레주슈)",
    lowEur: 0,
    midEur: 10,
    basis: "숙박객 카드(Carte d'hôte)로 계곡 버스·열차 무료, 없으면 편도 €1.5~3",
    sourceCheckedAt: CHECKED,
  },
  {
    id: "village-lodging",
    category: "마을형 숙소 4박(레 콩타민·라 풀리·샹페·트리앙, 1인 몫)",
    lowEur: 350,
    midEur: 530,
    basis:
      "C-3 하한 합계 €349(Gai Soleil 85 + Edelweiss CHF 95 + Plein Air CHF 82 + Auberge MB CHF 70) / 개인실 2인 분담 상한 합계 약 €530 [확정 2026-09-16]",
    sourceCheckedAt: RECHECKED,
  },
  {
    id: "refuge-halfboard",
    category: "산장 하프보드 7박(도미토리, 전부 프랑스·이탈리아)",
    lowEur: 455,
    midEur: 545,
    basis: "C-3 하한 합계 €453(68+60+75+70+70+60+50) / 상한 합계 €542 [확정 2026-09-16]",
    sourceCheckedAt: RECHECKED,
  },
  {
    id: "city-hotels",
    category: "제네바·샤모니 호텔 3박(제네바 1박·샤모니 2박, 1인 몫)",
    lowEur: 275,
    midEur: 390,
    basis: "제네바 3성 약 €150~180/실 + 샤모니 8월 €200~300/실 × 2박 = 실당 €550~780 → 2인 분담 [확정 2026-09-18, v3.1]",
    sourceCheckedAt: V3_CHECKED,
  },
  {
    id: "lunch-drinks",
    category: "점심·도시락·음료 12일",
    lowEur: 180,
    midEur: 360,
    basis: "산장 점심 세트 약 €18, 도시락 €10~16, 커피 €2~5, 맥주 €4~7 → €15/일 vs €30/일",
    sourceCheckedAt: CHECKED,
  },
  {
    id: "hotel-day-meals",
    category: "호텔 숙박일 식사 3일",
    lowEur: 90,
    midEur: 180,
    basis: "€30/일 vs €60/일",
    sourceCheckedAt: CHECKED,
  },
  {
    id: "insurance",
    category: "여행자보험 15일",
    lowEur: 40,
    midEur: 120,
    basis: "국내 다이렉트 종합형 약 €20~55(3~8만원) / World Nomads 2주 약 €140~275($150~300, 연령 의존)",
    sourceCheckedAt: CHECKED,
  },
  {
    id: "aiguille-du-midi",
    category: "에귀 뒤 미디 케이블카 왕복(8/16 관광)",
    lowEur: 60,
    midEur: 83,
    basis: "2026 동적 요금 €60.20~83(8월 성수기 €83 예상), 7~8월 온라인 시간대 예약 필수, 단체 요금은 20인 이상 [조사·기준일 2026-09-18]",
    sourceCheckedAt: V3_CHECKED,
  },
];

export const exchangeRates: ExchangeRate[] = [
  { pair: "CHF/EUR", rate: 1.07, checkedAt: CHECKED },
  { pair: "USD/EUR", rate: 0.92, checkedAt: CHECKED },
  { pair: "EUR/KRW", rate: 1500, checkedAt: CHECKED },
];

export const budgetMeta: BudgetMeta = {
  contingencyRate: 0.1,
  checkedAt: V3_CHECKED,
  validUntil: "2027-03-31",
  assumptions: [
    "8/3 제네바 1박 · 8/4 레 콩타민 1박부터 8/14 라 플레제르까지 트레킹 숙박 11박(마을형 4박 + 산장 7박) · 8/15~8/16 샤모니 2박(연속) = 총 14박",
    "호텔은 2인 1실 분담, 산장은 하프보드(저녁·아침)",
    "트레킹 구간 리프트·케이블카 비용 없음(전 구간 도보), 8/16 에귀 뒤 미디 관광 케이블카만 포함",
    "2025~2026 요금 기준, 2027년 물가 인상은 권장 준비 금액에만 반영, 항공권 제외",
  ],
  notes: [
    "권장 준비 금액: 2027년 물가 인상(연 3~5%, 2년) 반영 1인 약 €1,900~3,000 (약 285만~450만 원, 1 EUR ≈ 1,500원)",
    "1인 1실 위주로 바꾸면 마을형 숙소 4박 기준 +€250~450. 고산 산장(La Balme·Mottets·Maison Vieille·Bertone·Elena·La Flégère)은 도미토리가 기본",
    "SBB 단체권은 출발 2영업일 전까지 명단 제출. 8/3 밤 제네바 도착이 늦어 제네바 1박으로 확정했다.",
    "예비비 10%는 만실 대체 숙소·우천 시 택시 등 용도",
    "참고 총액(업계): 셀프가이드 산장 하프보드 10일 €700~900, 전 구간 €1,600~2,000/인",
  ],
  recommendedLowEur: 1900,
  recommendedHighEur: 3000,
  inflationLow: 0.03,
  inflationHigh: 0.05,
  inflationYears: 2,
};
