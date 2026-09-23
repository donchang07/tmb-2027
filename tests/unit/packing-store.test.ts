import { describe, expect, it } from "vitest";
import { PACKING_CATEGORIES, packingItems } from "@/data/seed/packing";
import { clearAll, emptyState, parseState, progress, serializeState, toggle } from "@/lib/packing-store";

const ids = new Set(packingItems.map((i) => i.id));

// PRD v2.0 부록 E (FR-015 seed) 원문
const APPENDIX_E: Record<string, string[]> = {
  "서류·돈": ["여권", "항공권·SBB 예약 확인", "여행자보험 증서", "현금 EUR·CHF", "신용카드"],
  "배낭·산장 취침용품": ["30~40L 배낭", "레인커버", "침낭 라이너", "귀마개", "헤드램프"],
  의류: ["하드셸 재킷·바지", "경량 다운", "트레킹 셔츠 2~3", "트레킹 바지 2", "양말 3~4", "모자·장갑", "산장용 샌들"],
  장비: ["트레킹 폴", "등산화(방수)", "선글라스", "물병·하이드레이션 2L", "정수 알약"],
  "안전·의료": ["개인 상비약", "물집 패드", "자외선 차단제", "응급 담요", "호루라기"],
  전자: ["휴대폰·보조배터리", "유럽 어댑터", "케이블"],
  기타: ["세면도구 소형", "속건 타월", "지퍼백", "도시락 용기"],
};

describe("packing seed (부록 E)", () => {
  it("categories match Appendix E labels and order", () => {
    expect(PACKING_CATEGORIES.map((c) => c.label)).toEqual(Object.keys(APPENDIX_E));
    expect(PACKING_CATEGORIES.map((c) => c.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("contains every Appendix E item in its category", () => {
    for (const [categoryLabel, entries] of Object.entries(APPENDIX_E)) {
      const category = PACKING_CATEGORIES.find((c) => c.label === categoryLabel);
      expect(category, categoryLabel).toBeDefined();
      const labels = packingItems.filter((i) => i.category === category?.id).map((i) => i.label);
      for (const entry of entries) {
        expect(labels.some((l) => l.includes(entry)), `${categoryLabel} / ${entry}`).toBe(true);
      }
    }
  });

  it("has unique ids and every item.category exists", () => {
    expect(ids.size).toBe(packingItems.length);
    const cats = new Set(PACKING_CATEGORIES.map((c) => c.id));
    for (const it of packingItems) expect(cats.has(it.category), it.id).toBe(true);
  });
});

describe("packing store (FR-015, SC-011)", () => {
  it("parses null, corrupt JSON and wrong version as empty", () => {
    expect(parseState(null, ids)).toEqual(emptyState());
    expect(parseState("{not json", ids)).toEqual(emptyState());
    expect(parseState(JSON.stringify({ version: 2, checked: { "docs-passport": true } }), ids)).toEqual(emptyState());
  });

  it("drops unknown ids and round-trips", () => {
    const raw = JSON.stringify({ version: 1, checked: { "docs-passport": true, ghost: true, "pack-boots": "yes" }, updatedAt: "2026-09-16T00:00:00.000Z" });
    const state = parseState(raw, ids);
    expect(state.checked).toEqual({ "docs-passport": true });
    expect(parseState(serializeState(state), ids)).toEqual(state);
  });

  it("toggle twice restores and clearAll empties", () => {
    const s1 = toggle(emptyState(), "docs-passport", "2026-09-16T01:00:00.000Z");
    expect(s1.checked["docs-passport"]).toBe(true);
    expect(s1.updatedAt).toBe("2026-09-16T01:00:00.000Z");
    const s2 = toggle(s1, "docs-passport", "2026-09-16T02:00:00.000Z");
    expect(s2.checked).toEqual({});
    expect(clearAll("x").checked).toEqual({});
  });

  it("computes progress with rounding", () => {
    expect(progress(emptyState(), packingItems)).toEqual({ done: 0, total: packingItems.length, percent: 0 });
    const all = packingItems.reduce((s, it) => toggle(s, it.id, "t"), emptyState());
    expect(progress(all, packingItems).percent).toBe(100);
    const one = toggle(emptyState(), "docs-passport", "t");
    expect(progress(one, packingItems).percent).toBe(Math.round((1 / packingItems.length) * 100));
  });
});
