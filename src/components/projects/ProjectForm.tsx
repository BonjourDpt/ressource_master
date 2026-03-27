"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { createProject, updateProject } from "@/app/projects/actions";
import { PROJECT_COLORS } from "@/lib/validations";
import type { ProjectFormData } from "@/lib/validations";
import type { ProjectModel } from "@/lib/planning-view-model";

interface ProjectFormProps {
  project?: ProjectModel | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const empty: ProjectFormData = { name: "", client: "", color: "" };

function isValidColor(c: string | null): c is (typeof PROJECT_COLORS)[number] {
  return c != null && PROJECT_COLORS.includes(c as (typeof PROJECT_COLORS)[number]);
}

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const [form, setForm] = useState<ProjectFormData>(
    project
      ? {
          name: project.name,
          client: project.client ?? "",
          color: isValidColor(project.color) ? project.color : "",
        }
      : empty
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData | "_form", string[]>>>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = project
        ? await updateProject(project.id, form)
        : await createProject(form);
      if (result.ok) {
        toast.success(project ? "Project saved" : "Project created");
        onSuccess();
      } else {
        setErrors(result.error as Partial<Record<keyof ProjectFormData | "_form", string[]>>);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors._form && (
        <p className="rounded-lg bg-[var(--rm-danger)]/10 px-3 py-2 text-sm text-[var(--rm-danger)]">
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
        placeholder="Project name"
        autoFocus
        required
      />
      <FormField
        label="Client"
        name="client"
        value={form.client}
        onChange={(e) => setForm((p) => ({ ...p, client: e.target.value }))}
        error={errors.client?.[0]}
        placeholder="Optional"
      />
      <div className="space-y-2">
        <label className="block text-[13px] font-medium text-[var(--rm-muted)]">Color</label>
        <div className="flex gap-2">
          {PROJECT_COLORS.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => setForm((p) => ({ ...p, color: form.color === hex ? "" : hex }))}
              className={`h-8 w-8 shrink-0 rounded-full border-2 transition-colors ${
                form.color === hex
                  ? "border-[var(--rm-primary)] ring-2 ring-[var(--rm-primary)]/20"
                  : "border-transparent hover:border-[var(--rm-border)]"
              }`}
              style={{ backgroundColor: hex }}
              title={hex}
              aria-pressed={form.color === hex}
            />
          ))}
        </div>
        {errors.color?.[0] && (
          <p className="text-xs text-[var(--rm-danger)]">{errors.color[0]}</p>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-6">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : project ? "Save" : "Create"}
        </Button>
      </div>
    </form>
  );
}
