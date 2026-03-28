import { type InputHTMLAttributes, forwardRef } from "react";

type InputSize = "default" | "compact";

const sizeClasses: Record<InputSize, string> = {
  default: "h-10 px-3 py-2 text-sm",
  compact: "h-8 px-3 py-1 text-xs",
};

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  error?: string;
  size?: InputSize;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, size = "default", className = "", ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={`w-full rounded-lg border bg-[var(--rm-surface)] text-[var(--rm-fg)] outline-none transition-colors placeholder:text-[var(--rm-muted-subtle)] focus:ring-2 focus:ring-[var(--rm-primary)]/20 focus:ring-offset-0 ${sizeClasses[size]} ${
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
