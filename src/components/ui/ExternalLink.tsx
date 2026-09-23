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
      className={`tap inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-alpine underline-offset-2 hover:underline ${className}`}
    >
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
