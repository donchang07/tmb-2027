export function SafetyCard({ fallback, emergency, checkedAt }: { fallback: string | undefined; emergency: string | undefined; checkedAt: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-amber sm:text-[15px]">우천·피로 시 대안</h3>
      <p className="mt-1 text-sm leading-[1.55] sm:text-[15px] sm:leading-[1.6]">{fallback ?? "대안 선택 사항 (Day 1·12)"}</p>
      <h3 className="mt-4 text-sm font-bold text-amber sm:text-[15px]">비상</h3>
      <p className="mt-2">
        <a href="tel:112" className="btn btn-danger w-full px-5 py-3.5 text-base sm:w-auto">
          112 긴급 전화
        </a>
      </p>
      <p className="mt-3 text-[13px] text-on-dark-muted">{emergency ?? "112 · 숙박 연락처"}</p>
      <p className="mt-1 text-[13px] text-on-dark-muted">확인 기준일 {checkedAt}</p>
    </div>
  );
}
