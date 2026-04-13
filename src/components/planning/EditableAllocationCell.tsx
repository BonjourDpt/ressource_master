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
import type { BookingHistoryCommitEvent } from "@/lib/planning-booking-history";
import type { BookingWithRelations, PlanningEditingCell } from "@/lib/planning-view-model";
import type { BookingFormData } from "@/lib/validations";

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
  /** Record server-backed allocation changes for undo/redo (planning grid). */
  onBookingHistoryCommit?: (ev: BookingHistoryCommitEvent) => void;
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
  onBookingHistoryCommit,
}: EditableAllocationCellProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurCommit = useRef(false);

  const [draft, setDraft] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetFromProps = useCallback(() => {
    setDraft(booking ? String(booking.allocationPct) : "");
    setDraftNote(booking?.note ?? "");
    setShowNote(false);
    setError(null);
    setHint(null);
  }, [booking]);

  useEffect(() => {
    if (!isEditing) return;
    resetFromProps();
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
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
        setError("Numbers only");
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => {
          resetFromProps();
          clearIfStillHere();
        }, 1200);
        return;
      }

      if (parsed.kind === "empty" || (parsed.kind === "value" && parsed.n <= 0)) {
        if (!booking) {
          clearIfStillHere();
          return;
        }
        const restorePayload: BookingFormData = {
          projectId,
          resourceId,
          weekStart,
          allocationPct: booking.allocationPct,
          note: booking.note?.trim() ?? "",
        };
        startTransition(async () => {
          const r = await deleteBooking(booking.id);
          if (r.ok) {
            onBookingHistoryCommit?.({ type: "delete", payload: restorePayload });
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

      if (n > 100) {
        setDraft(String(clamped));
        setHint("Capped at 100%");
      }

      const payload: BookingFormData = {
        projectId,
        resourceId,
        weekStart,
        allocationPct: clamped,
        note: noteVal.trim(),
      };

      startTransition(async () => {
        if (booking) {
          const r = await updateBooking(booking.id, payload);
          if (r.ok) {
            const before: BookingFormData = {
              projectId: booking.projectId,
              resourceId: booking.resourceId,
              weekStart,
              allocationPct: booking.allocationPct,
              note: booking.note?.trim() ?? "",
            };
            onBookingHistoryCommit?.({
              type: "update",
              bookingId: booking.id,
              before,
              after: payload,
            });
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
          return;
        }

        const r = await createBooking(payload);
        if (r.ok) {
          onBookingHistoryCommit?.({
            type: "create",
            bookingId: r.bookingId,
            payload,
          });
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
    [
      booking,
      draftNote,
      onBookingHistoryCommit,
      onEditingCellChange,
      projectId,
      resetFromProps,
      resourceId,
      router,
      rowId,
      weekStart,
    ],
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
  const pct = booking?.allocationPct ?? 0;

  const filledClasses = booking
    ? pct > 100
      ? "border border-[var(--rm-danger)]/30 bg-[var(--rm-danger)]/5 text-[var(--rm-danger)]"
      : pct === 100
        ? "bg-[var(--rm-primary)]/8 text-[var(--rm-primary-text)]"
        : "bg-[var(--rm-surface)] text-[var(--rm-muted)]"
    : "";

  if (!isEditing) {
    return (
      <div
        className={`flex min-h-[36px] items-center justify-center ${isPending ? "opacity-60" : ""}`}
      >
        {booking ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditingCellChange({ rowId, weekId: weekStart });
            }}
            title={hasNote ? booking.note! : "Edit allocation"}
            aria-label={`Edit allocation ${formatAllocationPercent(pct)}${hasNote ? ` — ${booking.note}` : ""}`}
            className={`relative min-w-[3rem] rounded-md px-2 py-1.5 text-center font-mono text-xs font-semibold tabular-nums ${filledClasses} overflow-hidden transition-all hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rm-primary)]/30`}
            style={accentStyle}
          >
            {formatAllocationPercent(pct)}
            {hasNote && (
              <span className="absolute right-0 top-0 border-l-[7px] border-t-[7px] border-l-transparent border-t-[var(--rm-primary)]" />
            )}
          </button>
        ) : (
          <button
            type="button"
            aria-label="Add allocation"
            title="Click to allocate (0% removes)"
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
          className="h-8 w-14 rounded-md border-2 border-[var(--rm-primary-text)] bg-[var(--rm-surface-highest)] px-1.5 text-center font-mono text-xs font-bold tabular-nums text-[var(--rm-primary-text)] outline-none"
          style={accentStyle}
        />
      </div>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          setShowNote(!showNote);
        }}
        className="mx-auto text-[10px] leading-tight text-[var(--rm-muted-subtle)] transition-colors hover:text-[var(--rm-muted)]"
      >
        {hasNote || draftNote.trim() ? "Edit note" : "Add note"}
      </button>
      {showNote && (
        <textarea
          value={draftNote}
          onChange={(e) => setDraftNote(e.target.value)}
          onBlur={() => {
            if (!draftNote.trim() && !hasNote) setShowNote(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              setShowNote(false);
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setShowNote(false);
              inputRef.current?.focus();
            }
          }}
          placeholder="Add a note…"
          maxLength={200}
          rows={2}
          autoFocus
          className="mt-0.5 w-full resize-none rounded border border-[var(--rm-border)] bg-[var(--rm-surface)] px-1.5 py-1 text-[11px] leading-snug text-[var(--rm-fg)] outline-none placeholder:text-[var(--rm-muted-subtle)] focus:border-[var(--rm-primary)]/50"
        />
      )}
      {error && <p className="mt-0.5 text-center text-[10px] leading-tight text-[var(--rm-danger)]">{error}</p>}
      {!error && hint && <p className="mt-0.5 text-center text-[10px] leading-tight text-[var(--rm-muted)]">{hint}</p>}
    </div>
  );
}
