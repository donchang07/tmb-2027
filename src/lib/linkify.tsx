import type { ReactNode } from "react";

const URL_SPLIT_RE = /(https?:\/\/[^\s)]+)/g;
const URL_TEST_RE = /^https?:\/\/[^\s)]+$/;

export function linkify(text: string): ReactNode[] {
  return text.split(URL_SPLIT_RE).map((part, i) =>
    URL_TEST_RE.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all text-alpine underline underline-offset-2">
        {part.replace(/^https?:\/\//, "")}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
