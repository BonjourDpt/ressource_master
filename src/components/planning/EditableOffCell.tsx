"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import { deleteResourceTimeOff, setResourceTimeOff } from "@/app/planning/actions";
import { formatAllocationPercent } from "@/lib/planning-format";
import type { PlanningEditingCell, ResourceTimeOffModel } from "@/lib/planning-view-model";

type ParsedInput =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "value"; n: number };

type ResourceTimeOffCellData = Omit<ResourceTimeOffModel, "weekStart"> & {
  weekStart: Date | string;
};

function parseOffInput(raw: string): ParsedInput {
  const s = raw.trim().replace(/%/g, "").trim();
  if (s === "") return { kind: "empty" };
  if (!/^\d+$/.test(s)) return { kind: "invalid" };
  const n = Number(s);
  if (!Number.isFinite(n)) return { kind: "invalid" };
  return { kind: "value", n };
}

export interface EditableOffCellProps {
  rowId: string;
  resourceId: string;
  weekStart: string;
  timeOff: ResourceTimeOffCellData | null;
  isEditing: boolean;
  onEditingCellChange: Dispatch<SetStateAction<PlanningEditingCell>>;
  onTabNavigate: (rowId: string, weekId: string, delta: number) => void;
}

export function EditableOffCell({
  rowId,
  resourceId,
  weekStart,
  timeOff,
  isEditing,
  onEditingCellChange,
  onTabNavigate,
}: EditableOffCellProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurCommit = useRef(false);
  const wasEditingRef = useRef(isEditing);
  const [draft, setDraft] = useState(() => (timeOff ? String(timeOff.offPct) : ""));
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetFromProps = useCallback(() => {
    setDraft(timeOff ? String(timeOff.offPct) : "");
    setError(null);
    setHint(null);
  }, [timeOff]);

  useEffect(() => {
    if (!wasEditingRef.current && isEditing) {
      queueMicrotask(() => {
        resetFromProps();
      });
    }
    wasEditingRef.current = isEditing;
  }, [isEditing, resetFromProps]);

  useEffect(() => {
    if (!isEditing) return;
    const id = requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.select();
    });
    return () => cancelAnimationFrame(id);
  }, [isEditing]);

  const clearIfStillHere = useCallback(() => {
    onEditingCellChange((cur) =>
      cur?.rowId === rowId && cur?.weekId === weekStart ? null : cur,
    );
  }, [onEditingCellChange, rowId, weekStart]);

  const runSave = useCallback(
    (parsed: ParsedInput) => {
      setError(null);

      if (parsed.kind === "invalid") {
        setError("Numbers only");
        return;
      }

      if (parsed.kind === "empty") {
        if (!timeOff) {
          clearIfStillHere();
          return;
        }
        startTransition(async () => {
          const r = await deleteResourceTimeOff(timeOff.id);
          if (r.ok) {
            router.refresh();
            clearIfStillHere();
          } else {
            const err = r.error;
            setError(("_form" in err ? err._form?.[0] : undefined) ?? "Delete failed");
          }
        });
        return;
      }

      const clamped = Math.min(100, Math.max(0, parsed.n));
      if (parsed.n > 100) {
        setDraft(String(clamped));
        setHint("Capped at 100%");
      }

      startTransition(async () => {
        const r = await setResourceTimeOff({
          resourceId,
          weekStart,
          offPct: clamped,
        });
        if (r.ok) {
          router.refresh();
          clearIfStillHere();
        } else {
          const err = r.error as Record<string, string[] | undefined>;
          const msg =
            err._form?.[0] ??
            err.offPct?.[0] ??
            err.resourceId?.[0] ??
            "Save failed";
          setError(msg);
        }
      });
    },
    [clearIfStillHere, resourceId, router, timeOff, weekStart],
  );

  const commit = useCallback(() => {
    runSave(parseOffInput(draft));
  }, [draft, runSave]);

  const cancel = useCallback(() => {
    resetFromProps();
    clearIfStillHere();
  }, [clearIfStillHere, resetFromProps]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    } else if (e.key === "Tab") {
      e.preventDefault();
      skipBlurCommit.current = true;
      commit();
      const delta = e.shiftKey ? -1 : 1;
      queueMicrotask(() => {
        skipBlurCommit.current = false;
        onTabNavigate(rowId, weekStart, delta);
      });
    }
  };

  if (!isEditing) {
    return (
      <div className={`flex min-h-[36px] items-center justify-center ${isPending ? "opacity-60" : ""}`}>
        {timeOff ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditingCellChange({ rowId, weekId: weekStart });
            }}
            title="Edit OFF"
            aria-label={`Edit OFF ${formatAllocationPercent(timeOff.offPct)}`}
            className="min-w-[3rem] rounded-md border border-[var(--rm-warning)]/20 bg-[var(--rm-warning)]/8 px-2 py-1.5 text-center font-mono text-xs font-semibold tabular-nums text-[var(--rm-warning)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rm-primary)]/30"
          >
            {formatAllocationPercent(timeOff.offPct)}
          </button>
        ) : (
          <button
            type="button"
            aria-label="Add OFF"
            title="Click to mark unavailable time"
            onClick={(e) => {
              e.stopPropagation();
              onEditingCellChange({ rowId, weekId: weekStart });
            }}
            className="flex min-h-8 w-full items-center justify-center rounded-md text-sm leading-none text-transparent transition-colors hover:bg-[var(--rm-surface-elevated)]/50 hover:text-[var(--rm-muted-subtle)] focus-visible:outline-none focus-visible:text-[var(--rm-muted-subtle)]"
          >
            +
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-[36px] flex-col items-stretch justify-center gap-1 px-0.5 py-1 ${isPending ? "opacity-60" : ""}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex justify-center">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={draft}
          onChange={(e) => {
            setError(null);
            setHint(null);
            setDraft(e.target.value);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (skipBlurCommit.current) return;
            commit();
          }}
          onFocus={(e) => e.target.select()}
          disabled={isPending}
          aria-label="OFF percent"
          className="h-8 w-14 rounded-md border-2 border-[var(--rm-warning)] bg-[var(--rm-surface-highest)] px-1.5 text-center font-mono text-xs font-bold tabular-nums text-[var(--rm-warning)] outline-none"
        />
      </div>
      {error && <p className="mt-0.5 text-center text-[10px] leading-tight text-[var(--rm-danger)]">{error}</p>}
      {!error && hint && <p className="mt-0.5 text-center text-[10px] leading-tight text-[var(--rm-muted)]">{hint}</p>}
    </div>
  );
}
