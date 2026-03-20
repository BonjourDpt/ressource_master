"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBooking, deleteBooking, updateBooking } from "@/app/planning/actions";
import { formatAllocationPercent } from "@/lib/planning-format";
import type { BookingWithRelations, ProjectModel, ResourceModel } from "@/lib/planning-view-model";

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
  cellKey: string;
  weekStart: string;
  booking: BookingWithRelations | null;
  /** When null, user must pick from `projectOptions` before create */
  projectId: string | null;
  /** When null, user must pick from `resourceOptions` before create */
  resourceId: string | null;
  projectOptions: ProjectModel[];
  resourceOptions: ResourceModel[];
  isEditing: boolean;
  onBeginEdit: (key: string) => void;
  onEndEdit: () => void;
  /** Project accent stripe (by-resource project rows) */
  accentColor?: string | null;
}

export function EditableAllocationCell({
  cellKey,
  weekStart,
  booking,
  projectId,
  resourceId,
  projectOptions,
  resourceOptions,
  isEditing,
  onBeginEdit,
  onEndEdit,
  accentColor,
}: EditableAllocationCellProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const projectSelectRef = useRef<HTMLSelectElement>(null);
  const resourceSelectRef = useRef<HTMLSelectElement>(null);

  const [draft, setDraft] = useState("");
  const [pickedProjectId, setPickedProjectId] = useState("");
  const [pickedResourceId, setPickedResourceId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resolvedProjectId = projectId ?? pickedProjectId;
  const resolvedResourceId = resourceId ?? pickedResourceId;
  const needsProjectPick = projectId === null && resourceId !== null;
  const needsResourcePick = resourceId === null && projectId !== null;

  const resetFromProps = useCallback(() => {
    setDraft(booking ? String(booking.allocationPct) : "");
    setPickedProjectId(projectId ?? "");
    setPickedResourceId(resourceId ?? "");
    setError(null);
  }, [booking, projectId, resourceId]);

  useEffect(() => {
    if (!isEditing) return;
    resetFromProps();
  }, [isEditing, resetFromProps]);

  useEffect(() => {
    if (!isEditing) return;
    const id = requestAnimationFrame(() => {
      if (needsProjectPick) {
        projectSelectRef.current?.focus();
        return;
      }
      if (needsResourcePick) {
        resourceSelectRef.current?.focus();
        return;
      }
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      if (booking) el.select();
    });
    return () => cancelAnimationFrame(id);
  }, [isEditing, needsProjectPick, needsResourcePick, booking]);

  const runSave = useCallback(
    (parsed: ParsedInput) => {
      setError(null);

      if (parsed.kind === "invalid") {
        resetFromProps();
        onEndEdit();
        return;
      }

      if (parsed.kind === "empty" || (parsed.kind === "value" && parsed.n <= 0)) {
        if (!booking) {
          onEndEdit();
          return;
        }
        startTransition(async () => {
          const r = await deleteBooking(booking.id);
          if (r.ok) {
            router.refresh();
            onEndEdit();
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

      if (!resolvedProjectId || !resolvedResourceId) {
        setError(
          needsProjectPick ? "Choose a project" : needsResourcePick ? "Choose a resource" : "Missing project or resource"
        );
        return;
      }

      const payload = {
        projectId: resolvedProjectId,
        resourceId: resolvedResourceId,
        weekStart,
        allocationPct: clamped,
        note: (booking?.note ?? "").trim(),
      };

      startTransition(async () => {
        const r = booking
          ? await updateBooking(booking.id, payload)
          : await createBooking(payload);
        if (r.ok) {
          router.refresh();
          onEndEdit();
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
      needsProjectPick,
      needsResourcePick,
      onEndEdit,
      resetFromProps,
      resolvedProjectId,
      resolvedResourceId,
      router,
      weekStart,
    ]
  );

  const commit = useCallback(() => {
    runSave(parseAllocationInput(draft));
  }, [draft, runSave]);

  const cancel = useCallback(() => {
    resetFromProps();
    onEndEdit();
  }, [onEndEdit, resetFromProps]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  const accentStyle =
    accentColor && !isEditing
      ? { boxShadow: `inset 3px 0 0 0 ${accentColor}` as const }
      : accentColor && isEditing
        ? { boxShadow: `inset 3px 0 0 0 ${accentColor}` as const }
        : undefined;

  if (!isEditing) {
    return (
      <div className={`flex min-h-[36px] items-center justify-center ${isPending ? "opacity-60" : ""}`}>
        {booking ? (
          <button
            type="button"
            onClick={() => onBeginEdit(cellKey)}
            title="Edit allocation"
            aria-label={`Edit allocation ${formatAllocationPercent(booking.allocationPct)}`}
            className="min-w-[3rem] rounded bg-[var(--rm-surface)] px-2.5 py-1.5 text-center text-sm font-medium tabular-nums text-[var(--rm-fg)] transition-colors hover:bg-[var(--rm-surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rm-primary)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rm-bg)]"
            style={accentStyle}
          >
            {formatAllocationPercent(booking.allocationPct)}
          </button>
        ) : (
          <button
            type="button"
            aria-label="Add allocation"
            onClick={() => onBeginEdit(cellKey)}
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
      {(needsProjectPick || needsResourcePick) && (
        <div className="flex w-full min-w-0 justify-center">
          {needsProjectPick && (
            <select
              ref={projectSelectRef}
              value={pickedProjectId}
              onChange={(e) => setPickedProjectId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancel();
                }
              }}
              disabled={isPending}
              className="max-w-full rounded border border-[var(--rm-border-subtle)] bg-[var(--rm-surface)] px-1 py-0.5 text-xs text-[var(--rm-fg)] focus:border-[var(--rm-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--rm-primary)]/35"
              aria-label="Project for allocation"
            >
              <option value="">Project…</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          {needsResourcePick && (
            <select
              ref={resourceSelectRef}
              value={pickedResourceId}
              onChange={(e) => setPickedResourceId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancel();
                }
              }}
              disabled={isPending}
              className="max-w-full rounded border border-[var(--rm-border-subtle)] bg-[var(--rm-surface)] px-1 py-0.5 text-xs text-[var(--rm-fg)] focus:border-[var(--rm-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--rm-primary)]/35"
              aria-label="Resource for allocation"
            >
              <option value="">Resource…</option>
              {resourceOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
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
          onBlur={() => commit()}
          disabled={isPending}
          aria-label="Allocation percent"
          className="h-8 w-[3.5rem] rounded border border-[var(--rm-primary)] bg-[var(--rm-surface)] px-1.5 text-center text-sm font-semibold tabular-nums text-[var(--rm-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--rm-primary)]/30"
          style={accentStyle}
        />
      </div>
      {error && <p className="text-center text-xs leading-tight text-[var(--rm-danger)]">{error}</p>}
    </div>
  );
}
