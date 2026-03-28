"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/ui/FormField";
import { FormGroup } from "@/components/ui/FormGroup";
import { FormAlert } from "@/components/ui/FormAlert";
import { Button } from "@/components/ui/Button";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { createProject, updateProject } from "@/app/projects/actions";
import { PROJECT_COLORS } from "@/lib/validations";
import type { ProjectFormData } from "@/lib/validations";
import type { ProjectModel } from "@/lib/planning-view-model";
import { cx } from "@/lib/cx";

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
      : empty,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormAlert message={errors._form?.[0]} />
      <FormField
        label="Name"
        name="name"
        value={form.name}
        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        onBlur={() => setErrors((e) => ({ ...e, name: undefined }))}
        error={errors.name?.[0]}
        placeholder="e.g. Website redesign"
        autoFocus
        required
      />
      <FormField
        label="Client"
        name="client"
        value={form.client}
        onChange={(e) => setForm((p) => ({ ...p, client: e.target.value }))}
        error={errors.client?.[0]}
        hint="Optional. Shown on the project list and in planning."
        placeholder="Company or account name"
      />
      <FormGroup
        label="Color"
        hint="Used as the project accent in the planning grid."
        error={errors.color?.[0]}
      >
        <div className="flex flex-wrap gap-2 pt-0.5">
          {PROJECT_COLORS.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => setForm((p) => ({ ...p, color: form.color === hex ? "" : hex }))}
              className={cx(
                "size-9 shrink-0 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rm-primary)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rm-surface)]",
                form.color === hex
                  ? "border-[var(--rm-primary)] ring-2 ring-[var(--rm-primary)]/20"
                  : "border-transparent hover:border-[var(--rm-border)]",
              )}
              style={{ backgroundColor: hex }}
              title={hex}
              aria-pressed={form.color === hex}
              aria-label={`Color ${hex}`}
            />
          ))}
        </div>
      </FormGroup>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : project ? "Save changes" : "Create project"}
        </Button>
      </ModalFooter>
    </form>
  );
}
