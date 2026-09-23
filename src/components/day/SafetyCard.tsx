export function SafetyCard({ fallback, emergency, checkedAt }: { fallback: string | undefined; emergency: string | undefined; checkedAt: string }) {
  return (
    <div className="card border-l-4 border-l-safety p-4">
      <h3 className="font-bold">우천·피로 시 대안</h3>
      <p className="mt-1 text-sm">{fallback ?? "대안 선택 사항 (Day 1·12)"}</p>
      <h3 className="mt-4 font-bold">비상</h3>
      <p className="mt-1 text-sm">
        <a href="tel:112" className="tap inline-flex items-center rounded-lg bg-safety px-3 font-bold text-white">
          112 긴급 전화
        </a>
      </p>
      <p className="mt-2 text-sm">{emergency ?? "112 · 숙박 연락처"}</p>
      <p className="mt-3 text-xs text-rock">확인 기준일 {checkedAt}</p>
    </div>
  );
}
