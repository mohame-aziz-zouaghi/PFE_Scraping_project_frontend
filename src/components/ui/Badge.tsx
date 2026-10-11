import type { ReactNode } from "react";
import clsx from "clsx";

type Tone = "gray" | "brand" | "success" | "warning" | "danger" | "info";

const TONES: Record<Tone, string> = {
  gray: "bg-surface-overlay text-text-secondary",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-danger-50 text-danger-700",
  info: "bg-blue-50 text-blue-700",
};

export default function Badge({
  tone = "gray",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}