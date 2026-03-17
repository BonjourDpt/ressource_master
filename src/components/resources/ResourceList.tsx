"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ResourceForm } from "./ResourceForm";
import { deleteResource } from "@/app/resources/actions";
import type { Resource } from "@prisma/client";

interface ResourceListProps {
  resources: Resource[];
}

export function ResourceList({ resources }: ResourceListProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (r: Resource) => {
    setEditing(r);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete resource "${name}"? This cannot be undone.`)) return;
    const result = await deleteResource(id);
    if (!result.ok) alert((result as { error: { _form: string[] } }).error._form[0]);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--rm-fg)]">Resources</h1>
        <Button onClick={openCreate}>New resource</Button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--rm-border)]">
              <th className="pb-3 pl-0 font-medium text-[13px] text-[var(--rm-muted)]">Name</th>
              <th className="pb-3 font-medium text-[13px] text-[var(--rm-muted)]">Role</th>
              <th className="pb-3 font-medium text-[13px] text-[var(--rm-muted)]">Team</th>
              <th className="pb-3 text-right font-medium text-[13px] text-[var(--rm-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id} className="border-b border-[var(--rm-border-subtle)] last:border-0">
                <td className="py-3 pl-0 text-[var(--rm-fg)]">{r.name}</td>
                <td className="py-3 text-[var(--rm-muted)]">{r.role ?? "—"}</td>
                <td className="py-3 text-[var(--rm-muted)]">{r.team ?? "—"}</td>
                <td className="py-3 text-right">
                  <Button variant="ghost" onClick={() => openEdit(r)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(r.id, r.name)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {resources.length === 0 && (
          <p className="py-8 text-center text-[var(--rm-muted)]">No resources.</p>
        )}
      </div>

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
    </>
  );
}
