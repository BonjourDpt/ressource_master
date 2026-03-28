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
import { Select } from "@/components/ui/Select";
import {
  DataTable,
  DataTableHead,
  DataTableTh,
  DataTableRow,
  DataTableCell,
} from "@/components/ui/DataTable";
import { ResourceForm } from "./ResourceForm";
import {
  archiveResource,
  deleteResource,
  unarchiveResource,
} from "@/app/resources/actions";
import type { LifecycleStatus, ResourceModel } from "@/lib/planning-view-model";

type StatusFilter = LifecycleStatus | "ALL";

const statusTabs = [
  { value: "ACTIVE" as StatusFilter, label: "Active" },
  { value: "ARCHIVED" as StatusFilter, label: "Archived" },
  { value: "ALL" as StatusFilter, label: "All" },
] as const;

interface ResourceListProps {
  resources: ResourceModel[];
}

export function ResourceList({ resources }: ResourceListProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceModel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResourceModel | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ResourceModel | null>(null);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");

  const teams = useMemo(() => {
    const set = new Set<string>();
    for (const r of resources) {
      if (r.team) set.add(r.team);
    }
    return [...set].sort();
  }, [resources]);

  const teamSelectOptions = useMemo(
    () => [
      { value: "ALL", label: "All teams" },
      ...teams.map((t) => ({ value: t, label: t })),
    ],
    [teams],
  );

  const filtered = useMemo(() => {
    let list = resources;
    if (statusFilter !== "ALL") {
      list = list.filter((r) => (r.status ?? "ACTIVE") === statusFilter);
    }
    if (teamFilter !== "ALL") {
      list = list.filter((r) => r.team === teamFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.role ?? "").toLowerCase().includes(q) ||
          (r.team ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [resources, statusFilter, teamFilter, search]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (r: ResourceModel) => {
    setEditing(r);
    setModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    startTransition(async () => {
      const result = await deleteResource(id);
      if (result.ok) {
        toast.success(`Resource "${name}" permanently deleted`);
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
      const result = await archiveResource(id);
      if (result.ok) {
        toast.success(`Resource "${name}" archived`);
        setArchiveTarget(null);
      } else {
        toast.error((result as { error: { _form: string[] } }).error._form[0]);
      }
    });
  };

  const handleUnarchive = (r: ResourceModel) => {
    startTransition(async () => {
      const result = await unarchiveResource(r.id);
      if (result.ok) {
        toast.success(`Resource "${r.name}" restored`);
      } else {
        toast.error((result as { error: { _form: string[] } }).error._form[0]);
      }
    });
  };

  const totalActive = resources.filter((r) => (r.status ?? "ACTIVE") === "ACTIVE").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Resources"
        action={<Button onClick={openCreate}>New resource</Button>}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SegmentedTabs
            tabs={statusTabs}
            value={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Filter by status"
          />
          {teams.length > 0 && (
            <div className="w-[11rem] min-w-[9rem]">
              <Select
                options={teamSelectOptions}
                value={teamFilter}
                onChange={setTeamFilter}
                size="compact"
                aria-label="Filter by team"
              />
            </div>
          )}
        </div>
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search resources…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="compact"
          />
        </div>
      </div>

      {totalActive === 0 && statusFilter === "ACTIVE" && !search && teamFilter === "ALL" ? (
        <EmptyState
          icon="users"
          title="No resources yet"
          description="Add your team members to start allocating them to projects."
          action={<Button onClick={openCreate}>New resource</Button>}
        />
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--rm-muted)]">
          No matching resources found.
        </p>
      ) : (
        <DataTable>
          <DataTableHead>
            <DataTableTh>Name</DataTableTh>
            <DataTableTh>Role</DataTableTh>
            <DataTableTh>Team</DataTableTh>
            <DataTableTh>Capacity</DataTableTh>
            <DataTableTh align="right">Actions</DataTableTh>
          </DataTableHead>
          <tbody>
            {filtered.map((r) => {
              const isArchived = r.status === "ARCHIVED";
              return (
                <DataTableRow key={r.id} dimmed={isArchived}>
                  <DataTableCell>
                    {r.name}
                    {isArchived && (
                      <span className="ml-2 rounded bg-[var(--rm-surface)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--rm-muted-subtle)]">
                        Archived
                      </span>
                    )}
                  </DataTableCell>
                  <DataTableCell muted>{r.role ?? "—"}</DataTableCell>
                  <DataTableCell muted>{r.team ?? "—"}</DataTableCell>
                  <DataTableCell muted>
                    <span className="font-mono tabular-nums">{r.capacity}h</span>
                  </DataTableCell>
                  <DataTableCell align="right">
                    {isArchived ? (
                      <>
                        <Button variant="ghost" size="compact" onClick={() => handleUnarchive(r)} disabled={isPending}>
                          Restore
                        </Button>
                        <Button variant="danger" size="compact" onClick={() => setDeleteTarget(r)}>
                          Delete
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="compact" onClick={() => openEdit(r)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="compact" onClick={() => setArchiveTarget(r)}>
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
        title={editing ? "Edit resource" : "New resource"}
        description={
          editing
            ? "Adjust details used for filtering and capacity in planning."
            : "People you can assign to projects. Capacity sets how many hours per week they can be planned."
        }
        size="md"
      >
        <ResourceForm
          resource={editing}
          onSuccess={() => setModalOpen(false)}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        onConfirm={confirmArchive}
        title="Archive resource"
        message={`Archive resource "${archiveTarget?.name}"? They will be hidden from planning but can be restored later.`}
        confirmLabel="Archive"
        confirmVariant="primary"
        isPending={isPending}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete resource permanently"
        message={`Permanently delete resource "${deleteTarget?.name}"? This will remove all their allocations and cannot be undone.`}
        confirmLabel="Delete permanently"
        isPending={isPending}
      />
    </div>
  );
}
