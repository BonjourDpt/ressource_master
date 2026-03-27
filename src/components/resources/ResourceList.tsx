"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResourceForm } from "./ResourceForm";
import {
  archiveResource,
  deleteResource,
  unarchiveResource,
} from "@/app/resources/actions";
import type { LifecycleStatus, ResourceModel } from "@/lib/planning-view-model";
import { cx } from "@/lib/cx";

type StatusFilter = LifecycleStatus | "ALL";

const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "ALL", label: "All" },
];

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
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--rm-fg)]">Resources</h1>
        <Button onClick={openCreate}>New resource</Button>
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
          {teams.length > 0 && (
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="ml-2 rounded-lg border border-[var(--rm-border)] bg-[var(--rm-surface)] px-2 py-1.5 text-xs text-[var(--rm-fg)] outline-none transition-colors focus:border-[var(--rm-primary)]"
            >
              <option value="ALL">All teams</option>
              {teams.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search resources…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--rm-border)]">
                <th className="pb-3 pl-0 font-medium text-[13px] text-[var(--rm-muted)]">Name</th>
                <th className="pb-3 font-medium text-[13px] text-[var(--rm-muted)]">Role</th>
                <th className="pb-3 font-medium text-[13px] text-[var(--rm-muted)]">Team</th>
                <th className="pb-3 font-medium text-[13px] text-[var(--rm-muted)]">Capacity</th>
                <th className="pb-3 text-right font-medium text-[13px] text-[var(--rm-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isArchived = r.status === "ARCHIVED";
                return (
                  <tr
                    key={r.id}
                    className={cx(
                      "border-b border-[var(--rm-border-subtle)] last:border-0",
                      isArchived && "opacity-60",
                    )}
                  >
                    <td className="py-3 pl-0 text-[var(--rm-fg)]">
                      {r.name}
                      {isArchived && (
                        <span className="ml-2 rounded bg-[var(--rm-surface)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--rm-muted-subtle)]">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-[var(--rm-muted)]">{r.role ?? "—"}</td>
                    <td className="py-3 text-[var(--rm-muted)]">{r.team ?? "—"}</td>
                    <td className="py-3 text-[var(--rm-muted)]">{r.capacity}h</td>
                    <td className="py-3 text-right">
                      {isArchived ? (
                        <>
                          <Button variant="ghost" onClick={() => handleUnarchive(r)} disabled={isPending}>
                            Restore
                          </Button>
                          <Button variant="danger" onClick={() => setDeleteTarget(r)}>
                            Delete
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" onClick={() => openEdit(r)}>
                            Edit
                          </Button>
                          <Button variant="ghost" onClick={() => setArchiveTarget(r)}>
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
        title={editing ? "Edit resource" : "New resource"}
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
    </>
  );
}
