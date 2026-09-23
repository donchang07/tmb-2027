export type PackingCategory = { id: string; label: string; order: number };
export type PackingItem = { id: string; category: string; label: string; note?: string };

export const PACKING_CATEGORIES: PackingCategory[] = [
  { id: "docs", label: "서류·돈", order: 1 },
  { id: "pack", label: "배낭·산장 취침용품", order: 2 },
  { id: "clothes", label: "의류", order: 3 },
  { id: "gear", label: "장비", order: 4 },
  { id: "medical", label: "안전·의료", order: 5 },
  { id: "tech", label: "전자", order: 6 },
  { id: "misc", label: "기타", order: 7 },
];

export const packingItems: PackingItem[] = [
  { id: "docs-passport", category: "docs", label: "여권", note: "유효기간 6개월 이상" },
  { id: "docs-tickets", category: "docs", label: "항공권·SBB 예약 확인", note: "오프라인 저장" },
  { id: "docs-insurance", category: "docs", label: "여행자보험 증서" },
  { id: "docs-cash", category: "docs", label: "현금 EUR·CHF", note: "현금 전용 산장용: Lac Blanc·Bellachat·Bovine·La Peule" },
  { id: "docs-cards", category: "docs", label: "신용카드", note: "2장 분산 보관" },

  { id: "pack-backpack", category: "pack", label: "30~40L 배낭" },
  { id: "pack-raincover", category: "pack", label: "레인커버" },
  { id: "pack-liner", category: "pack", label: "침낭 라이너", note: "산장 필수" },
  { id: "pack-earplugs", category: "pack", label: "귀마개" },
  { id: "pack-headlamp", category: "pack", label: "헤드램프" },

  { id: "clothes-hardshell", category: "clothes", label: "하드셸 재킷·바지" },
  { id: "clothes-down", category: "clothes", label: "경량 다운" },
  { id: "clothes-shirts", category: "clothes", label: "트레킹 셔츠 2~3" },
  { id: "clothes-pants", category: "clothes", label: "트레킹 바지 2" },
  { id: "clothes-socks", category: "clothes", label: "양말 3~4" },
  { id: "clothes-hat-gloves", category: "clothes", label: "모자·장갑" },
  { id: "clothes-sandals", category: "clothes", label: "산장용 샌들" },

  { id: "gear-poles", category: "gear", label: "트레킹 폴", note: "Day 12 −1,490 m 하강" },
  { id: "gear-boots", category: "gear", label: "등산화(방수)" },
  { id: "gear-sunglasses", category: "gear", label: "선글라스" },
  { id: "gear-water", category: "gear", label: "물병·하이드레이션 2L" },
  { id: "gear-purifier", category: "gear", label: "정수 알약" },

  { id: "medical-meds", category: "medical", label: "개인 상비약" },
  { id: "medical-blister", category: "medical", label: "물집 패드" },
  { id: "medical-sunscreen", category: "medical", label: "자외선 차단제" },
  { id: "medical-blanket", category: "medical", label: "응급 담요" },
  { id: "medical-whistle", category: "medical", label: "호루라기" },

  { id: "tech-phone", category: "tech", label: "휴대폰·보조배터리", note: "오프라인 캐시용" },
  { id: "tech-adapter", category: "tech", label: "유럽 어댑터" },
  { id: "tech-cable", category: "tech", label: "케이블" },

  { id: "misc-toiletries", category: "misc", label: "세면도구 소형" },
  { id: "misc-towel", category: "misc", label: "속건 타월" },
  { id: "misc-ziplock", category: "misc", label: "지퍼백" },
  { id: "misc-lunchbox", category: "misc", label: "도시락 용기" },
];
