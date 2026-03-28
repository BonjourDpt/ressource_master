import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "ghost-muted" | "danger" | "danger-ghost";
type Size = "default" | "compact";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--rm-primary)] text-white hover:bg-[var(--rm-primary-hover)] focus:ring-2 focus:ring-[var(--rm-primary)]/30 focus:ring-offset-2 focus:ring-offset-[var(--rm-bg)]",
  secondary:
    "border border-[var(--rm-border)] bg-transparent text-[var(--rm-fg)] hover:bg-[var(--rm-surface)] focus:ring-2 focus:ring-[var(--rm-border)] focus:ring-offset-2 focus:ring-offset-[var(--rm-bg)]",
  ghost:
    "text-[var(--rm-muted)] hover:bg-[var(--rm-surface)] hover:text-[var(--rm-fg)] focus:ring-2 focus:ring-[var(--rm-border)] focus:ring-offset-2 focus:ring-offset-[var(--rm-bg)]",
  "ghost-muted":
    "text-[var(--rm-muted-subtle)] group-hover:text-[var(--rm-muted)] hover:bg-[var(--rm-surface)] hover:!text-[var(--rm-fg)] focus:ring-2 focus:ring-[var(--rm-border)] focus:ring-offset-2 focus:ring-offset-[var(--rm-bg)]",
  danger:
    "border border-[var(--rm-danger)] text-[var(--rm-danger)] bg-transparent hover:bg-[var(--rm-danger)]/10 hover:border-[var(--rm-danger-hover)] hover:text-[var(--rm-danger-hover)] focus:ring-2 focus:ring-[var(--rm-danger)]/30 focus:ring-offset-2 focus:ring-offset-[var(--rm-bg)]",
  "danger-ghost":
    "text-[var(--rm-muted-subtle)] group-hover:text-[var(--rm-danger)] hover:bg-[var(--rm-danger)]/10 hover:!text-[var(--rm-danger-hover)] focus:ring-2 focus:ring-[var(--rm-danger)]/30 focus:ring-offset-2 focus:ring-offset-[var(--rm-bg)]",
};

const sizes: Record<Size, string> = {
  default: "px-4 py-2 text-sm",
  compact: "px-3 py-1.5 text-xs",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", className = "", disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  )
);
Button.displayName = "Button";
