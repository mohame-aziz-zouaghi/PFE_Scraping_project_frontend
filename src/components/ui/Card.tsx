import type { ReactNode } from "react";
import clsx from "clsx";

export default function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={clsx(
        "bg-surface-elevated rounded-lg border border-border-subtle shadow-sm",
        padded && "p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}