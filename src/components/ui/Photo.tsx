import type { CSSProperties, ReactNode } from "react";

export function Photo({
  src,
  className = "",
  position,
  children,
}: {
  src?: string;
  className?: string;
  position?: string;
  children?: ReactNode;
}) {
  const style: CSSProperties = {};
  if (src) style.backgroundImage = `url("${src}")`;
  if (position) style.backgroundPosition = position;
  return (
    <div className={`photo ${className}`} style={style} data-enter="img">
      {children}
    </div>
  );
}
