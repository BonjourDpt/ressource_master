"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ModalFooter } from "@/components/ui/ModalFooter";
import {
  DataTable,
  DataTableHead,
  DataTableTh,
  DataTableRow,
  DataTableCell,
} from "@/components/ui/DataTable";
import { cx } from "@/lib/cx";
import type { AutoMappingEntry, EntityType } from "@/lib/csv-mapping";
import { normalizeStatus, parseDate } from "@/lib/csv-mapping";
import { checkExistingNames, importCsvData } from "@/app/admin/actions";

interface ImportPreviewStepProps {
  entityType: EntityType;
  mappings: AutoMappingEntry[];
  csvRows: Record<string, string>[];
  onBack: () => void;
  onDone: (result: { created: number; updated: number; errors: string[] }) => void;
}

type RowStatus = "new" | "update" | "duplicate";

interface PreviewRow {
  mapped: Record<string, string>;
  status: RowStatus;
}

const MAX_PREVIEW = 100;

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  role: "Role",
  team: "Team",
  capacity: "Capacity",
  client: "Client",
  color: "Color",
  status: "Status",
  createdAt: "Created at",
};

export function ImportPreviewStep({
  entityType,
  mappings,
  csvRows,
  onBack,
  onDone,
}: ImportPreviewStepProps) {
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const activeMappings = mappings.filter((m) => m.dbField !== null) as (AutoMappingEntry & { dbField: string })[];
  const dbColumns = activeMappings.map((m) => m.dbField);

  const buildMappedRows = useCallback(() => {
    return csvRows.map((row) => {
      const mapped: Record<string, string> = {};
      for (const m of activeMappings) {
        mapped[m.dbField] = row[m.csvHeader] ?? "";
      }
      return mapped;
    });
  }, [csvRows, activeMappings]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const mappedAll = buildMappedRows();

      const names = mappedAll
        .map((r) => r.name?.trim())
        .filter((n): n is string => !!n);

      let existingNames: string[] = [];
      try {
        existingNames = await checkExistingNames(entityType, names);
      } catch {
        // If the check fails, treat all as new
      }

      if (cancelled) return;

      const existingSet = new Set(existingNames.map((n) => n.toLowerCase()));
      const seenInCsv = new Set<string>();
      const rows: PreviewRow[] = [];

      for (const mapped of mappedAll) {
        const name = mapped.name?.trim().toLowerCase() ?? "";
        let status: RowStatus;

        if (!name) {
          continue;
        } else if (seenInCsv.has(name)) {
          status = "duplicate";
        } else if (existingSet.has(name)) {
          status = "update";
        } else {
          status = "new";
        }

        seenInCsv.add(name);
        rows.push({ mapped, status });
      }

      setPreviewRows(rows);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const newCount = previewRows.filter((r) => r.status === "new").length;
  const updateCount = previewRows.filter((r) => r.status === "update").length;
  const dupCount = previewRows.filter((r) => r.status === "duplicate").length;
  const importCount = newCount + updateCount;

  const handleImport = async () => {
    setImporting(true);

    const rowsToImport = previewRows
      .filter((r) => r.status !== "duplicate")
      .map((r) => {
        const row = { ...r.mapped };
        if (row.status !== undefined) {
          row.status = normalizeStatus(row.status);
        }
        if (row.createdAt !== undefined) {
          const d = parseDate(row.createdAt);
          row.createdAt = d ? d.toISOString() : "";
        }
        return row;
      });

    try {
      const result = await importCsvData(entityType, rowsToImport);
      if (result.ok) {
        onDone({ created: result.created, updated: result.updated, errors: result.errors });
      } else {
        onDone({ created: 0, updated: 0, errors: [result.error] });
      }
    } catch (e) {
      onDone({
        created: 0,
        updated: 0,
        errors: [e instanceof Error ? e.message : "Import failed"],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-sm text-[var(--rm-muted)]">Checking existing records...</div>
      </div>
    );
  }

  const visibleRows = previewRows.slice(0, MAX_PREVIEW);

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        <SummaryPill label="New" count={newCount} color="bg-emerald-500/15 text-emerald-400" />
        <SummaryPill label="Update" count={updateCount} color="bg-[var(--rm-primary)]/15 text-[var(--rm-primary-hover)]" />
        {dupCount > 0 && (
          <SummaryPill label="Duplicates (skipped)" count={dupCount} color="bg-[var(--rm-warning)]/15 text-[var(--rm-warning)]" />
        )}
      </div>

      {/* Preview table */}
      <DataTable>
        <DataTableHead>
          <DataTableTh>Status</DataTableTh>
          {dbColumns.map((col) => (
            <DataTableTh key={col}>{FIELD_LABELS[col] ?? col}</DataTableTh>
          ))}
        </DataTableHead>
        <tbody>
          {visibleRows.map((row, i) => (
            <DataTableRow
              key={i}
              dimmed={row.status === "duplicate"}
            >
              <DataTableCell>
                <StatusBadge status={row.status} />
              </DataTableCell>
              {dbColumns.map((col) => (
                <DataTableCell key={col}>
                  {row.mapped[col] || <span className="text-[var(--rm-muted-subtle)]">—</span>}
                </DataTableCell>
              ))}
            </DataTableRow>
          ))}
        </tbody>
      </DataTable>

      {previewRows.length > MAX_PREVIEW && (
        <p className="text-xs text-[var(--rm-muted)]">
          Showing {MAX_PREVIEW} of {previewRows.length} rows. All rows will be imported.
        </p>
      )}

      <ModalFooter className="mt-8">
        <Button variant="secondary" onClick={onBack} disabled={importing}>
          Back
        </Button>
        <Button onClick={handleImport} disabled={importing || importCount === 0}>
          {importing ? "Importing…" : `Import ${importCount} record${importCount !== 1 ? "s" : ""}`}
        </Button>
      </ModalFooter>
    </div>
  );
}

function SummaryPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={cx("rounded-full px-3 py-1 text-xs font-medium", color)}>
      {count} {label}
    </div>
  );
}

function StatusBadge({ status }: { status: RowStatus }) {
  const styles: Record<RowStatus, string> = {
    new: "bg-emerald-500/15 text-emerald-400",
    update: "bg-[var(--rm-primary)]/15 text-[var(--rm-primary-hover)]",
    duplicate: "bg-[var(--rm-warning)]/15 text-[var(--rm-warning)]",
  };
  const labels: Record<RowStatus, string> = {
    new: "New",
    update: "Update",
    duplicate: "Duplicate",
  };
  return (
    <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}
