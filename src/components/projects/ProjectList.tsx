"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectForm } from "./ProjectForm";
import {
  archiveProject,
  deleteProject,
  unarchiveProject,
} from "@/app/projects/actions";
import type { LifecycleStatus, ProjectModel } from "@/lib/planning-view-model";
import { cx } from "@/lib/cx";

type StatusFilter = LifecycleStatus | "ALL";

const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "ALL", label: "All" },
];

interface ProjectListProps {
  projects: ProjectModel[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectModel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectModel | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ProjectModel | null>(null);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");

  const filtered = useMemo(() => {
    let list = projects;
    if (statusFilter !== "ALL") {
      list = list.filter((p) => (p.status ?? "ACTIVE") === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.client ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [projects, statusFilter, search]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (p: ProjectModel) => {
    setEditing(p);
    setModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    startTransition(async () => {
      const result = await deleteProject(id);
      if (result.ok) {
        toast.success(`Project "${name}" permanently deleted`);
        setDeleteTarget(null);
      } else {
        toast.error((result as { error: { _form: string[] } }).error._form[0]);
      }
    });
  };

  const confirmArchive = () => {
    if (!archiveTarget) return;
    const { id, name } = archiveTarget;
    startTransition(async () => {
      const result = await archiveProject(id);
      if (result.ok) {
        toast.success(`Project "${name}" archived`);
        setArchiveTarget(null);
      } else {
        toast.error((result as { error: { _form: string[] } }).error._form[0]);
      }
    });
  };

  const handleUnarchive = (p: ProjectModel) => {
    startTransition(async () => {
      const result = await unarchiveProject(p.id);
      if (result.ok) {
        toast.success(`Project "${p.name}" restored`);
      } else {
        toast.error((result as { error: { _form: string[] } }).error._form[0]);
      }
    });
  };

  const totalActive = projects.filter((p) => (p.status ?? "ACTIVE") === "ACTIVE").length;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--rm-fg)]">Projects</h1>
        <Button onClick={openCreate}>New project</Button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={cx(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === tab.value
                  ? "bg-[var(--rm-surface-elevated)] text-[var(--rm-fg)]"
                  : "text-[var(--rm-muted)] hover:text-[var(--rm-fg)]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {totalActive === 0 && statusFilter === "ACTIVE" ? (
        <EmptyState
          icon="folder"
          title="No projects yet"
          description="Create your first project to start planning resource allocations."
          action={<Button onClick={openCreate}>New project</Button>}
        />
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--rm-muted)]">
          No matching projects found.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--rm-border)]">
                <th className="pb-3 pl-0 font-medium text-[13px] text-[var(--rm-muted)]">Name</th>
                <th className="pb-3 font-medium text-[13px] text-[var(--rm-muted)]">Client</th>
                <th className="pb-3 text-right font-medium text-[13px] text-[var(--rm-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isArchived = p.status === "ARCHIVED";
                return (
                  <tr
                    key={p.id}
                    className={cx(
                      "border-b border-[var(--rm-border-subtle)] last:border-0",
                      isArchived && "opacity-60",
                    )}
                  >
                    <td className="py-3 pl-0 text-[var(--rm-fg)]">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: p.color ?? "transparent" }}
                      />
                      <span className="ml-2">{p.name}</span>
                      {isArchived && (
                        <span className="ml-2 rounded bg-[var(--rm-surface)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--rm-muted-subtle)]">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-[var(--rm-muted)]">{p.client ?? "—"}</td>
                    <td className="py-3 text-right">
                      {isArchived ? (
                        <>
                          <Button variant="ghost" onClick={() => handleUnarchive(p)} disabled={isPending}>
                            Restore
                          </Button>
                          <Button variant="danger" onClick={() => setDeleteTarget(p)}>
                            Delete
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" onClick={() => openEdit(p)}>
                            Edit
                          </Button>
                          <Button variant="ghost" onClick={() => setArchiveTarget(p)}>
                            Archive
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit project" : "New project"}
      >
        <ProjectForm
          project={editing}
          onSuccess={() => setModalOpen(false)}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        onConfirm={confirmArchive}
        title="Archive project"
        message={`Archive project "${archiveTarget?.name}"? It will be hidden from planning but can be restored later.`}
        confirmLabel="Archive"
        confirmVariant="primary"
        isPending={isPending}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete project permanently"
        message={`Permanently delete project "${deleteTarget?.name}"? This will remove all its allocations and cannot be undone.`}
        confirmLabel="Delete permanently"
        isPending={isPending}
      />
    </>
  );
}
