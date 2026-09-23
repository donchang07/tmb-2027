type Tone = "info" | "warn" | "error";

const TONE: Record<Tone, string> = {
  info: "border-alpine/30 bg-alpine/5 text-alpine-dark",
  warn: "border-amber-300 bg-amber-50 text-amber-900",
  error: "border-safety/40 bg-safety/5 text-safety",
};

export function StatusNote({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: Tone;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`card border p-4 ${TONE[tone]}`}>
      <p className="font-semibold">{title}</p>
      {children ? <div className="mt-1 text-sm">{children}</div> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
