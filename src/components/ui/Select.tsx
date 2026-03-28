"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "@/lib/cx";

export type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectSize = "default" | "compact";

const triggerSize: Record<SelectSize, string> = {
  default: "h-10 min-h-10 px-3 text-sm",
  compact: "h-8 min-h-8 px-3 text-xs",
};

const optionSize: Record<SelectSize, string> = {
  default: "px-3 py-2 text-sm",
  compact: "px-3 py-1.5 text-xs",
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx(
        "shrink-0 text-[var(--rm-muted-subtle)] transition-transform duration-150",
        open && "rotate-180",
      )}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: SelectSize;
  id?: string;
  className?: string;
  "aria-label"?: string;
  error?: boolean;
  "aria-describedby"?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select…",
  disabled = false,
  size = "default",
  id,
  className,
  "aria-label": ariaLabel,
  error,
  "aria-describedby": ariaDescribedBy,
}: SelectProps) {
  const autoId = useId();
  const listboxId = `${id ?? autoId}-listbox`;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? (value ? value : null);

  const enabledIndices = options
    .map((o, i) => (o.disabled ? -1 : i))
    .filter((i) => i >= 0);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
      setHighlight(-1);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setHighlight(-1);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const selectIndex = (idx: number) => {
    const opt = options[idx];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    setHighlight(-1);
    triggerRef.current?.focus();
  };

  const moveHighlight = (delta: number) => {
    if (enabledIndices.length === 0) return;
    let pos = enabledIndices.indexOf(highlight);
    if (pos < 0) pos = 0;
    else {
      pos = (pos + delta + enabledIndices.length) % enabledIndices.length;
    }
    setHighlight(enabledIndices[pos]!);
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Tab") {
      if (open) {
        setOpen(false);
        setHighlight(-1);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlight(enabledIndices[0] ?? -1);
      } else {
        moveHighlight(1);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open) moveHighlight(-1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && highlight >= 0) {
        selectIndex(highlight);
      } else {
        setOpen((o) => {
          const next = !o;
          if (next) setHighlight(enabledIndices[0] ?? -1);
          else setHighlight(-1);
          return next;
        });
      }
    }
  };

  const triggerClass = cx(
    "flex w-full items-center justify-between gap-2 rounded-lg border bg-[var(--rm-surface)] text-left font-normal text-[var(--rm-fg)] outline-none transition-colors",
    triggerSize[size],
    disabled && "cursor-not-allowed opacity-50",
    !disabled && "hover:bg-[var(--rm-surface-elevated)]",
    error
      ? "border-[var(--rm-danger)] focus-visible:border-[var(--rm-danger)] focus-visible:ring-2 focus-visible:ring-[var(--rm-danger)]/20"
      : "border-[var(--rm-border)] focus-visible:border-[var(--rm-primary)] focus-visible:ring-2 focus-visible:ring-[var(--rm-primary)]/25",
    open && !error && "border-[var(--rm-primary)] ring-2 ring-[var(--rm-primary)]/20",
  );

  const menu = open && !disabled && (
    <div
      ref={menuRef}
      id={listboxId}
      role="listbox"
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        width: coords.width,
        zIndex: 200,
        // Portaled to document.body: ensure dark surface even if CSS vars fail to inherit
        backgroundColor: "var(--rm-surface-highest, #252529)",
        color: "var(--rm-fg, #e7e4ea)",
        colorScheme: "dark",
      }}
      className="max-h-60 overflow-auto rounded-lg border border-[var(--rm-border)] py-1 shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
    >
      {options.map((opt, idx) => {
        const isSelected = opt.value === value;
        const isHi = idx === highlight;
        return (
          <button
            key={`${opt.value}-${idx}`}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={opt.disabled}
            onMouseEnter={() => !opt.disabled && setHighlight(idx)}
            onClick={() => selectIndex(idx)}
            className={cx(
              "flex w-full items-center text-left transition-colors",
              optionSize[size],
              opt.disabled && "cursor-not-allowed opacity-40",
              !opt.disabled &&
                isSelected &&
                (isHi
                  ? "bg-[var(--rm-primary)]/15 font-medium text-[var(--rm-primary-text)]"
                  : "bg-[var(--rm-primary)]/10 font-medium text-[var(--rm-primary-text)]"),
              !opt.disabled && !isSelected && isHi && "bg-[var(--rm-surface-elevated)] text-[var(--rm-fg)]",
              !opt.disabled && !isSelected && !isHi && "text-[var(--rm-muted)] hover:bg-[var(--rm-surface-elevated)] hover:text-[var(--rm-fg)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={cx("relative min-w-0 w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => {
            const next = !o;
            if (next) setHighlight(enabledIndices[0] ?? -1);
            else setHighlight(-1);
            return next;
          });
        }}
        onKeyDown={onTriggerKeyDown}
        className={triggerClass}
      >
        <span
          className={cx(
            "min-w-0 flex-1 truncate",
            !displayLabel && "text-[var(--rm-muted-subtle)]",
          )}
        >
          {displayLabel ?? placeholder}
        </span>
        <Chevron open={open} />
      </button>
      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
