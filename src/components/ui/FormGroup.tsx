import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

interface FormGroupProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormGroup({ label, hint, error, children, className }: FormGroupProps) {
  return (
    <div className={cx("space-y-1.5", className)}>
      <span className="block text-sm font-medium text-[var(--rm-fg)]">{label}</span>
      {hint ? (
        <p className="text-xs leading-relaxed text-[var(--rm-muted)]">{hint}</p>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-[var(--rm-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
