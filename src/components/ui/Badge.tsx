type Tone = "neutral" | "alpine" | "safety" | "success" | "warn";

// 배지 면은 흰색 + 얇은 윤곽선: Surface 카드와 흰 페이지 어디서나 글자 대비 4.5:1 이상 (DESIGN.md §4.5).
const TONE: Record<Tone, string> = {
  neutral: "text-rock",
  alpine: "text-alpine-dark",
  safety: "text-safety",
  success: "text-alpine-dark",
  warn: "font-semibold text-ink",
};

export function Badge({ children, tone = "neutral", className = "" }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-rock/20 ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}
