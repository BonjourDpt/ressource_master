import { type InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={`h-10 w-full rounded-lg border bg-[var(--rm-surface)] px-3 py-2 text-sm text-[var(--rm-fg)] outline-none transition-colors placeholder:text-[var(--rm-muted-subtle)] focus:ring-2 focus:ring-[var(--rm-primary)]/20 focus:ring-offset-0 ${
          error
            ? "border-[var(--rm-danger)] focus:border-[var(--rm-danger)]"
            : "border-[var(--rm-border)] focus:border-[var(--rm-primary)]"
        } ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {error && (
        <p
          id={`${props.id}-error`}
          className="mt-1.5 text-xs text-[var(--rm-danger)]"
        >
          {error}
        </p>
      )}
    </div>
  )
);
Input.displayName = "Input";
