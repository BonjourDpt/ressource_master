"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProjectForm } from "./ProjectForm";
import { deleteProject } from "@/app/projects/actions";
import type { Project } from "@prisma/client";

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    const result = await deleteProject(id);
    if (!result.ok) alert((result as { error: { _form: string[] } }).error._form[0]);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--rm-fg)]">Projects</h1>
        <Button onClick={openCreate}>New project</Button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--rm-border)]">
              <th className="pb-3 pl-0 font-medium text-[13px] text-[var(--rm-muted)]">Name</th>
              <th className="pb-3 font-medium text-[13px] text-[var(--rm-muted)]">Client</th>
              <th className="pb-3 font-medium text-[13px] text-[var(--rm-muted)]">Color</th>
              <th className="pb-3 text-right font-medium text-[13px] text-[var(--rm-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-[var(--rm-border-subtle)] last:border-0">
                <td className="py-3 pl-0 text-[var(--rm-fg)]">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: p.color ?? "transparent" }}
                  />
                  <span className="ml-2">{p.name}</span>
                </td>
                <td className="py-3 text-[var(--rm-muted)]">{p.client ?? "—"}</td>
                <td className="py-3 text-[var(--rm-muted)]">{p.color ?? "—"}</td>
                <td className="py-3 text-right">
                  <Button variant="ghost" onClick={() => openEdit(p)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(p.id, p.name)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && (
          <p className="py-8 text-center text-[var(--rm-muted)]">No projects.</p>
        )}
      </div>

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
    </>
  );
}
