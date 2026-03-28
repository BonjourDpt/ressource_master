import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

/** Primary actions on the right: secondary/cancel first, then primary in JSX order with justify-end. */
export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cx(
        "mt-6 flex flex-col-reverse gap-2 border-t border-[var(--rm-border-subtle)]/80 pt-5 sm:flex-row sm:justify-end sm:gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
