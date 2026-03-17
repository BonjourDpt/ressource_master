import { type InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--rm-muted)] focus:ring-2 focus:ring-[var(--rm-fg)]/20 ${
          error
            ? "border-red-500 focus:border-red-500"
            : "border-[var(--rm-border)]"
        } ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${props.id}-error`} className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
);
Input.displayName = "Input";
