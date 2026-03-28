"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import {
  DataTable,
  DataTableHead,
  DataTableTh,
  DataTableRow,
  DataTableCell,
} from "@/components/ui/DataTable";
import { ProjectForm } from "./ProjectForm";
import {
  archiveProject,
  deleteProject,
  unarchiveProject,
} from "@/app/projects/actions";
import type { LifecycleStatus, ProjectModel } from "@/lib/planning-view-model";

type StatusFilter = LifecycleStatus | "ALL";

const statusTabs = [
  { value: "ACTIVE" as StatusFilter, label: "Active" },
  { value: "ARCHIVED" as StatusFilter, label: "Archived" },
  { value: "ALL" as StatusFilter, label: "All" },
] as const;

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
    <div className="space-y-5">
      <PageHeader
        title="Projects"
        action={<Button onClick={openCreate}>New project</Button>}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedTabs
          tabs={statusTabs}
          value={statusFilter}
          onChange={setStatusFilter}
          ariaLabel="Filter by status"
        />
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="compact"
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
        <DataTable>
          <DataTableHead>
            <DataTableTh>Name</DataTableTh>
            <DataTableTh>Client</DataTableTh>
            <DataTableTh align="right">Actions</DataTableTh>
          </DataTableHead>
          <tbody>
            {filtered.map((p) => {
              const isArchived = p.status === "ARCHIVED";
              return (
                <DataTableRow key={p.id} dimmed={isArchived}>
                  <DataTableCell>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: p.color ?? "transparent" }}
                      />
                      <span>{p.name}</span>
                      {isArchived && (
                        <span className="rounded bg-[var(--rm-surface)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--rm-muted-subtle)]">
                          Archived
                        </span>
                      )}
                    </span>
                  </DataTableCell>
                  <DataTableCell muted>{p.client ?? "—"}</DataTableCell>
                  <DataTableCell align="right">
                    {isArchived ? (
                      <>
                        <Button variant="ghost" size="compact" onClick={() => handleUnarchive(p)} disabled={isPending}>
                          Restore
                        </Button>
                        <Button variant="danger" size="compact" onClick={() => setDeleteTarget(p)}>
                          Delete
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="compact" onClick={() => openEdit(p)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="compact" onClick={() => setArchiveTarget(p)}>
                          Archive
                        </Button>
                      </>
                    )}
                  </DataTableCell>
                </DataTableRow>
              );
            })}
          </tbody>
        </DataTable>
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
    </div>
  );
}
