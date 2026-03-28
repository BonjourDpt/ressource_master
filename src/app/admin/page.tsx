import { CsvImportWizard } from "@/components/admin/CsvImportWizard";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AdminPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Admin" />

      <section className="rounded-xl border border-[var(--rm-border)]/40 bg-[var(--rm-surface)] p-6">
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
