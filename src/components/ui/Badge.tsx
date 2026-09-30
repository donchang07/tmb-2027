type Tone = "neutral" | "sage" | "dark" | "amber" | "danger" | "success" | "warn" | "light" | "outline";

const TONE: Record<Tone, string> = {
  neutral: "border border-line bg-bone text-ink-2",
  sage: "bg-sage-200 text-forest-900",
  dark: "bg-forest-900 text-bone",
  amber: "bg-amber text-amber-ink",
  danger: "bg-danger text-white",
  success: "bg-forest-700 text-white",
  warn: "bg-warn-bg text-warn-fg",
  light: "bg-bone text-forest-900",
  outline: "border border-line text-ink-2",
};

export function Badge({ children, tone = "neutral", className = "" }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return <span className={`badge ${TONE[tone]} ${className}`}>{children}</span>;
}
