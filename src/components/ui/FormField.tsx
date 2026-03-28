import { type InputHTMLAttributes, forwardRef } from "react";
import { Input, type InputProps } from "./Input";

export interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: string;
  error?: string;
  size?: InputProps["size"];
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, hint, id, error, ...props }, ref) => {
    const fieldId = id ?? props.name;
    const describedBy = hint && fieldId ? `${fieldId}-hint` : undefined;

    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="block text-sm font-medium text-[var(--rm-fg)]">
          {label}
        </label>
        {hint ? (
          <p
            id={`${fieldId}-hint`}
            className="text-xs leading-relaxed text-[var(--rm-muted)]"
          >
            {hint}
          </p>
        ) : null}
        <Input ref={ref} id={fieldId} error={error} aria-describedby={describedBy} {...props} />
      </div>
    );
  },
);
FormField.displayName = "FormField";
