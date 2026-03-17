"use client";

import { useState, useTransition } from "react";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { createBooking, updateBooking, deleteBooking } from "@/app/planning/actions";
import type { BookingFormData } from "@/lib/validations";
import type { Booking, Project, Resource } from "@prisma/client";
import { getWeekRange, getIsoMonday, formatWeekLabel } from "@/lib/weeks";

interface BookingFormProps {
  booking: (Booking & { project: Project; resource: Resource }) | null;
  projects: Project[];
  resources: Resource[];
  weekRange: Date[];
  initialProjectId?: string;
  initialResourceId?: string;
  initialWeekStart?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BookingForm({
  booking,
  projects,
  resources,
  weekRange,
  initialProjectId,
  initialResourceId,
  initialWeekStart,
  onSuccess,
  onCancel,
}: BookingFormProps) {
  const firstWeekValue =
    weekRange.length > 0 ? getIsoMonday(weekRange[0]).toISOString().slice(0, 10) : "";

  const [form, setForm] = useState<BookingFormData>(
    booking
      ? {
          projectId: booking.projectId,
          resourceId: booking.resourceId,
          weekStart: getIsoMonday(booking.weekStart).toISOString().slice(0, 10),
          allocationPct: booking.allocationPct,
          note: booking.note ?? "",
        }
      : {
          projectId: initialProjectId ?? "",
          resourceId: initialResourceId ?? "",
          weekStart: initialWeekStart ?? firstWeekValue,
          allocationPct: 50,
          note: "",
        }
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof BookingFormData | "_form", string[]>>
  >({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const weekDate = new Date(form.weekStart);
      const payload = { ...form, weekStart: weekDate.toISOString() };
      const result = booking
        ? await updateBooking(booking.id, payload)
        : await createBooking(payload);
      if (result.ok) {
        onSuccess();
      } else {
        setErrors(result.error as Partial<Record<keyof BookingFormData | "_form", string[]>>);
      }
    });
  };

  const handleDelete = () => {
    if (!booking || !confirm("Delete this booking?")) return;
    startTransition(async () => {
      const result = await deleteBooking(booking.id);
      if (result.ok) onSuccess();
      else setErrors({ _form: [(result as { error: { _form: string[] } }).error._form[0]] });
    });
  };

  const weekOptions = weekRange.map((w) => {
    const d = getIsoMonday(w);
    return { value: d.toISOString().slice(0, 10), label: formatWeekLabel(d) };
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors._form && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {errors._form[0]}
        </p>
      )}
      <div className="space-y-1">
        <label htmlFor="projectId" className="block text-sm font-medium text-[var(--rm-fg)]">
          Project
        </label>
        <select
          id="projectId"
          name="projectId"
          value={form.projectId}
          onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
          className="w-full rounded-xl border border-[var(--rm-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--rm-fg)]/20"
        >
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {errors.projectId?.[0] && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.projectId[0]}</p>
        )}
      </div>
      <div className="space-y-1">
        <label htmlFor="resourceId" className="block text-sm font-medium text-[var(--rm-fg)]">
          Resource
        </label>
        <select
          id="resourceId"
          name="resourceId"
          value={form.resourceId}
          onChange={(e) => setForm((p) => ({ ...p, resourceId: e.target.value }))}
          className="w-full rounded-xl border border-[var(--rm-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--rm-fg)]/20"
        >
          <option value="">Select resource</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {errors.resourceId?.[0] && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.resourceId[0]}</p>
        )}
      </div>
      <div className="space-y-1">
        <label htmlFor="weekStart" className="block text-sm font-medium text-[var(--rm-fg)]">
          Week
        </label>
        <select
          id="weekStart"
          name="weekStart"
          value={form.weekStart}
          onChange={(e) => setForm((p) => ({ ...p, weekStart: e.target.value }))}
          className="w-full rounded-xl border border-[var(--rm-border)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--rm-fg)]/20"
        >
          {weekOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {errors.weekStart?.[0] && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.weekStart[0]}</p>
        )}
      </div>
      <FormField
        label="Allocation %"
        name="allocationPct"
        type="number"
        min={1}
        max={100}
        value={String(form.allocationPct)}
        onChange={(e) =>
          setForm((p) => ({ ...p, allocationPct: parseInt(e.target.value, 10) || 0 }))
        }
        error={errors.allocationPct?.[0]}
      />
      <FormField
        label="Note"
        name="note"
        value={form.note}
        onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
        error={errors.note?.[0]}
        placeholder="Optional"
      />
      <div className="flex justify-between gap-2 pt-4">
        <div>
          {booking && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : booking ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </form>
  );
}
