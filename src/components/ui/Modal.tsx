"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import FocusTrap from "focus-trap-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** sm ≈ narrow forms, md ≈ wider content */
  size?: "sm" | "md";
}

const sizeClass: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
};

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "sm",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const stableOnClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") stableOnClose();
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, stableOnClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="absolute inset-0 bg-black/55" aria-hidden onClick={onClose} />
      <FocusTrap
        focusTrapOptions={{
          escapeDeactivates: false,
          allowOutsideClick: true,
          fallbackFocus: () => panelRef.current!,
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          className={`relative flex max-h-[min(90vh,800px)] w-full flex-col overflow-hidden rounded-xl border border-[var(--rm-border)]/90 bg-[var(--rm-surface)] shadow-[0_4px_24px_rgba(0,0,0,0.22)] outline-none ${sizeClass[size]}`}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="shrink-0 border-b border-[var(--rm-border-subtle)]/70 px-6 pb-4 pt-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1">
                <h2
                  id={titleId}
                  className="text-lg font-semibold leading-snug tracking-tight text-[var(--rm-fg)]"
                >
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="text-sm leading-relaxed text-[var(--rm-muted)]">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-md p-1.5 text-[var(--rm-muted)] transition-colors hover:bg-[var(--rm-surface-elevated)] hover:text-[var(--rm-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rm-primary)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rm-surface)]"
              >
                <CloseIcon />
              </button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        </div>
      </FocusTrap>
    </div>
  );
}
