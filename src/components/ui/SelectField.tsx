import { Select, type SelectProps } from "./Select";
import { cx } from "@/lib/cx";

export interface SelectFieldProps extends Omit<SelectProps, "error"> {
  label: string;
  hint?: string;
  error?: string;
}

export function SelectField({ label, hint, error, id, ...selectProps }: SelectFieldProps) {
  const errMsg = error;
  const describedBy =
    [hint && id ? `${id}-hint` : null, errMsg && id ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-[var(--rm-fg)]">
        {label}
      </label>
      {hint ? (
        <p id={id ? `${id}-hint` : undefined} className="text-xs leading-relaxed text-[var(--rm-muted)]">
          {hint}
        </p>
      ) : null}
      <Select {...selectProps} id={id} error={!!errMsg} aria-describedby={describedBy} />
      {errMsg ? (
        <p id={id ? `${id}-error` : undefined} className="text-xs text-[var(--rm-danger)]" role="alert">
          {errMsg}
        </p>
      ) : null}
    </div>
  );
}
