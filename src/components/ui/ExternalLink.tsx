import type { ReactNode } from "react";

export function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`tap ix-link inline-flex items-center gap-1 rounded-[12px] py-2 text-sm font-semibold text-forest-700 ${className}`}
    >
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
