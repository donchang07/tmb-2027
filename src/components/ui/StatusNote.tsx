type Tone = "info" | "warn" | "error";

const TONE: Record<Tone, string> = {
  info: "bg-sage-200 text-forest-900",
  warn: "bg-warn-bg text-warn-fg",
  error: "border border-danger bg-white text-danger-ink",
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
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-[12px] p-4 sm:px-5 ${TONE[tone]}`}>
      <p className="font-semibold">{title}</p>
      {children ? <div className="mt-1 text-sm leading-relaxed">{children}</div> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
