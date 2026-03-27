import { CsvImportWizard } from "@/components/admin/CsvImportWizard";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--rm-fg)]">
        Admin
      </h1>

      <section className="rounded-xl border border-[var(--rm-border)] bg-[var(--rm-surface-elevated)] p-6">
        <h2 className="mb-1 text-base font-medium text-[var(--rm-fg)]">
          CSV Import
        </h2>
        <p className="mb-6 text-sm text-[var(--rm-muted)]">
          Import resources or projects from a CSV file. Columns are automatically
          mapped and existing records are updated by name.
        </p>
        <CsvImportWizard />
      </section>
    </div>
  );
}
