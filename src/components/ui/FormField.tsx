import { type InputHTMLAttributes, forwardRef } from "react";
import { Input } from "./Input";

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, id, error, ...props }, ref) => {
    const fieldId = id ?? props.name;
    return (
      <div className="space-y-2">
        <label
          htmlFor={fieldId}
          className="block text-[13px] font-medium text-[var(--rm-muted)]"
        >
          {label}
        </label>
        <Input ref={ref} id={fieldId} error={error} {...props} />
      </div>
    );
  }
);
FormField.displayName = "FormField";
