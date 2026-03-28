"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { createResource, updateResource } from "@/app/resources/actions";
import type { ResourceFormData } from "@/lib/validations";
import type { ResourceModel } from "@/lib/planning-view-model";

interface ResourceFormProps {
  resource?: ResourceModel | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const empty: ResourceFormData = { name: "", role: "", team: "", capacity: 37.5 };

export function ResourceForm({ resource, onSuccess, onCancel }: ResourceFormProps) {
  const [form, setForm] = useState<ResourceFormData>(
    resource
      ? {
          name: resource.name,
          role: resource.role ?? "",
          team: resource.team ?? "",
          capacity: resource.capacity,
        }
      : empty,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof ResourceFormData | "_form", string[]>>
  >({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = resource
        ? await updateResource(resource.id, form)
        : await createResource(form);
      if (result.ok) {
        toast.success(resource ? "Resource saved" : "Resource created");
        onSuccess();
      } else {
        setErrors(result.error as Partial<Record<keyof ResourceFormData | "_form", string[]>>);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors._form && (
        <p
          className="rounded-lg border border-[var(--rm-danger)]/25 bg-[var(--rm-danger)]/10 px-3 py-2.5 text-sm text-[var(--rm-danger)]"
          role="alert"
        >
          {errors._form[0]}
        </p>
      )}
      <FormField
        label="Name"
        name="name"
        value={form.name}
        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        onBlur={() => setErrors((e) => ({ ...e, name: undefined }))}
        error={errors.name?.[0]}
        placeholder="e.g. Alex Chen"
        autoFocus
        required
      />
      <FormField
        label="Role"
        name="role"
        value={form.role}
        onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
        error={errors.role?.[0]}
        hint="Optional job title or discipline."
        placeholder="e.g. Product designer"
      />
      <FormField
        label="Team"
        name="team"
        value={form.team}
        onChange={(e) => setForm((p) => ({ ...p, team: e.target.value }))}
        error={errors.team?.[0]}
        hint="Optional. Used for filters on Resources and Planning."
        placeholder="e.g. Design"
      />
      <FormField
        label="Capacity"
        name="capacity"
        type="number"
        step="0.1"
        min={0}
        value={String(form.capacity)}
        onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.valueAsNumber }))}
        error={errors.capacity?.[0]}
        hint="Hours per week available for allocation."
        placeholder="37.5"
        required
      />
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : resource ? "Save changes" : "Create resource"}
        </Button>
      </ModalFooter>
    </form>
  );
}
