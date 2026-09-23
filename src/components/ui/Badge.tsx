type Tone = "neutral" | "alpine" | "safety" | "success" | "warn";

const TONE: Record<Tone, string> = {
  neutral: "bg-rock/10 text-rock",
  alpine: "bg-alpine/10 text-alpine",
  safety: "bg-safety/10 text-safety",
  success: "bg-emerald-100 text-emerald-800",
  warn: "bg-amber-100 text-amber-800",
};

export function Badge({ children, tone = "neutral", className = "" }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}
