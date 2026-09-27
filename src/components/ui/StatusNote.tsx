type Tone = "info" | "warn" | "error";

// 제목 색만 톤을 따른다. 면은 모두 Surface, 왼쪽 색 막대·테두리 없음 (DESIGN.md §4.5).
const TITLE: Record<Tone, string> = {
  info: "text-ink",
  warn: "text-ink",
  error: "text-safety",
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
    <div role={tone === "error" ? "alert" : "status"} className="card p-4 text-ink">
      <p className={`font-semibold ${TITLE[tone]}`}>{title}</p>
      {children ? <div className="mt-1 text-sm">{children}</div> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
