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
import { createBooking, deleteBooking, updateBooking } from "@/app/planning/actions";
import { formatAllocationPercent } from "@/lib/planning-format";
import type { BookingWithRelations, PlanningEditingCell } from "@/lib/planning-view-model";

type ParsedInput =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "value"; n: number };

function parseAllocationInput(raw: string): ParsedInput {
  const s = raw.trim().replace(/%/g, "").trim();
  if (s === "") return { kind: "empty" };
  if (!/^\d+$/.test(s)) return { kind: "invalid" };
  const n = Number(s);
  if (!Number.isFinite(n)) return { kind: "invalid" };
  return { kind: "value", n };
}

export interface EditableAllocationCellProps {
  rowId: string;
  weekStart: string;
  booking: BookingWithRelations | null;
  projectId: string;
  resourceId: string;
  isEditing: boolean;
  onEditingCellChange: Dispatch<SetStateAction<PlanningEditingCell>>;
  onTabNavigate: (rowId: string, weekId: string, delta: number) => void;
  /** Project accent stripe (by-resource project rows) */
  accentColor?: string | null;
}

export function EditableAllocationCell({
  rowId,
  weekStart,
  booking,
  projectId,
  resourceId,
  isEditing,
  onEditingCellChange,
  onTabNavigate,
  accentColor,
}: EditableAllocationCellProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurCommit = useRef(false);

  const [draft, setDraft] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetFromProps = useCallback(() => {
    setDraft(booking ? String(booking.allocationPct) : "");
    setDraftNote(booking?.note ?? "");
    setShowNote(false);
    setError(null);
  }, [booking]);

  useEffect(() => {
    if (!isEditing) return;
    resetFromProps();
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

  const runSave = useCallback(
    (parsed: ParsedInput, noteOverride?: string) => {
      setError(null);
      const noteVal = noteOverride ?? draftNote;

      const clearIfStillHere = () => {
        onEditingCellChange((cur) =>
          cur?.rowId === rowId && cur?.weekId === weekStart ? null : cur,
        );
      };

      if (parsed.kind === "invalid") {
        resetFromProps();
        clearIfStillHere();
        return;
      }

      if (parsed.kind === "empty" || (parsed.kind === "value" && parsed.n <= 0)) {
        if (!booking) {
          clearIfStillHere();
          return;
        }
        startTransition(async () => {
          const r = await deleteBooking(booking.id);
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

      if (parsed.kind !== "value") return;
      const n = parsed.n;
      const clamped = Math.min(100, Math.max(1, n));

      const payload = {
        projectId,
        resourceId,
        weekStart,
        allocationPct: clamped,
        note: noteVal.trim(),
      };

      startTransition(async () => {
        const r = booking
          ? await updateBooking(booking.id, payload)
          : await createBooking(payload);
        if (r.ok) {
          router.refresh();
          clearIfStillHere();
        } else {
          const err = r.error;
          const msg =
            ("_form" in err ? err._form?.[0] : undefined) ??
            ("allocationPct" in err ? err.allocationPct?.[0] : undefined) ??
            ("projectId" in err ? err.projectId?.[0] : undefined) ??
            ("resourceId" in err ? err.resourceId?.[0] : undefined) ??
            "Save failed";
          setError(msg);
        }
      });
    },
    [booking, draftNote, onEditingCellChange, projectId, resetFromProps, resourceId, router, rowId, weekStart],
  );

  const commit = useCallback(() => {
    runSave(parseAllocationInput(draft));
  }, [draft, runSave]);

  const cancel = useCallback(() => {
    resetFromProps();
    onEditingCellChange((cur) =>
      cur?.rowId === rowId && cur?.weekId === weekStart ? null : cur,
    );
  }, [onEditingCellChange, resetFromProps, rowId, weekStart]);

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

  const accentStyle =
    accentColor != null
      ? ({ boxShadow: `inset 3px 0 0 0 ${accentColor}` } as const)
      : undefined;

  const hasNote = booking?.note != null && booking.note.trim().length > 0;

  if (!isEditing) {
    return (
      <div
        className={`flex min-h-[36px] items-center justify-center ${isPending ? "opacity-60" : ""}`}
      >
        {booking ? (
          <button
            type="button"
            onClick={() => onEditingCellChange({ rowId, weekId: weekStart })}
            title={hasNote ? booking.note! : "Edit allocation"}
            aria-label={`Edit allocation ${formatAllocationPercent(booking.allocationPct)}${hasNote ? ` — ${booking.note}` : ""}`}
            className="relative min-w-[3rem] rounded bg-[var(--rm-surface)] px-2.5 py-1.5 text-center text-sm font-medium tabular-nums text-[var(--rm-fg)] transition-colors hover:bg-[var(--rm-surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rm-primary)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rm-bg)]"
            style={accentStyle}
          >
            {formatAllocationPercent(booking.allocationPct)}
            {hasNote && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--rm-primary)]" />
            )}
          </button>
        ) : (
          <button
            type="button"
            aria-label="Add allocation"
            onClick={() => onEditingCellChange({ rowId, weekId: weekStart })}
            className="flex min-h-8 w-full max-w-[3.5rem] items-center justify-center rounded text-lg font-light leading-none text-[var(--rm-muted-subtle)] transition-colors hover:bg-[var(--rm-surface)] hover:text-[var(--rm-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rm-primary)]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rm-bg)]"
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
            setDraft(e.target.value);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (skipBlurCommit.current) return;
            if (showNote) return;
            commit();
          }}
          onFocus={(e) => e.target.select()}
          disabled={isPending}
          aria-label="Allocation percent"
          className="h-8 w-[3.5rem] rounded border border-[var(--rm-primary)]/40 bg-[var(--rm-surface-elevated)] px-1.5 text-center text-sm font-semibold tabular-nums text-[var(--rm-fg)] shadow-[inset_0_0_0_1px_var(--rm-primary)]/15 outline-none ring-1 ring-[var(--rm-primary)]/20 focus:border-[var(--rm-primary)]/60 focus:ring-[var(--rm-primary)]/30"
          style={accentStyle}
        />
      </div>
      <button
        type="button"
        onClick={() => setShowNote(!showNote)}
        className="mx-auto text-[10px] leading-tight text-[var(--rm-muted-subtle)] transition-colors hover:text-[var(--rm-muted)]"
      >
        {hasNote || draftNote.trim() ? "Edit note" : "Add note"}
      </button>
      {showNote && (
        <textarea
          value={draftNote}
          onChange={(e) => setDraftNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setShowNote(false);
            }
          }}
          placeholder="Add a note…"
          maxLength={200}
          rows={2}
          className="mt-0.5 w-full resize-none rounded border border-[var(--rm-border)] bg-[var(--rm-surface)] px-1.5 py-1 text-[11px] leading-snug text-[var(--rm-fg)] outline-none placeholder:text-[var(--rm-muted-subtle)] focus:border-[var(--rm-primary)]/50"
        />
      )}
      {error && <p className="text-center text-xs leading-tight text-[var(--rm-danger)]">{error}</p>}
    </div>
  );
}
