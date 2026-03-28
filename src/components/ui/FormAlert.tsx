interface FormAlertProps {
  message: string | undefined;
}

export function FormAlert({ message }: FormAlertProps) {
  if (!message) return null;
  return (
    <div
      className="flex items-start gap-2.5 rounded-lg border border-[var(--rm-danger)]/25 bg-[var(--rm-danger)]/10 px-3 py-2.5 text-sm text-[var(--rm-danger)]"
      role="alert"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 shrink-0"
        aria-hidden
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
