import { type TextareaHTMLAttributes, forwardRef } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = "", rows = 4, ...props }, ref) => (
    <div className="w-full">
      <textarea
        ref={ref}
        rows={rows}
        className={`min-h-[5.5rem] w-full resize-y rounded-lg border bg-[var(--rm-surface)] px-3 py-2.5 text-sm leading-relaxed text-[var(--rm-fg)] outline-none transition-colors placeholder:text-[var(--rm-muted-subtle)] focus:ring-2 focus:ring-[var(--rm-primary)]/20 focus:ring-offset-0 ${
          error
            ? "border-[var(--rm-danger)] focus:border-[var(--rm-danger)]"
            : "border-[var(--rm-border)] focus:border-[var(--rm-primary)]"
        } ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${props.id}-error`} className="mt-1.5 text-xs text-[var(--rm-danger)]">
          {error}
        </p>
      )}
    </div>
  ),
);
Textarea.displayName = "Textarea";
