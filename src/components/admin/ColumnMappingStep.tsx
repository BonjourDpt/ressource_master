"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { ModalFooter } from "@/components/ui/ModalFooter";
import {
  DataTable,
  DataTableHead,
  DataTableTh,
  DataTableRow,
  DataTableCell,
} from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Select";
import { cx } from "@/lib/cx";
import type { AutoMappingEntry, ConfidenceLevel, EntityType } from "@/lib/csv-mapping";
import { getFieldsForEntity } from "@/lib/csv-mapping";

interface ColumnMappingStepProps {
  entityType: EntityType;
  mappings: AutoMappingEntry[];
  onMappingChange: (csvHeader: string, dbField: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

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

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const styles: Record<ConfidenceLevel, string> = {
    exact: "bg-emerald-500/15 text-emerald-400",
    high: "bg-[var(--rm-primary)]/15 text-[var(--rm-primary-hover)]",
    medium: "bg-[var(--rm-warning)]/15 text-[var(--rm-warning)]",
  };
  const labels: Record<ConfidenceLevel, string> = {
    exact: "Exact match",
    high: "High confidence",
    medium: "Suggested",
  };
  return (
    <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-medium", styles[level])}>
      {labels[level]}
    </span>
  );
}

export function ColumnMappingStep({
  entityType,
  mappings,
  onMappingChange,
  onNext,
  onBack,
}: ColumnMappingStepProps) {
  const dbFields = useMemo(() => getFieldsForEntity(entityType), [entityType]);
  const assignedFields = useMemo(
    () => new Set(mappings.filter((m) => m.dbField).map((m) => m.dbField)),
    [mappings],
  );

  const nameIsMapped = mappings.some((m) => m.dbField === "name");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-medium text-[var(--rm-fg)]">Map columns</h2>
        <p className="mt-1 text-xs text-[var(--rm-muted)]">
          Match each CSV column to a database field. The <strong>Name</strong> field is required for deduplication.
        </p>
      </div>

      <DataTable>
        <DataTableHead>
          <DataTableTh>CSV Column</DataTableTh>
          <DataTableTh>Maps To</DataTableTh>
          <DataTableTh>Confidence</DataTableTh>
        </DataTableHead>
        <tbody>
          {mappings.map((m) => (
            <DataTableRow key={m.csvHeader}>
              <DataTableCell className="font-mono text-xs">
                {m.csvHeader}
              </DataTableCell>
              <DataTableCell>
                <Select
                  options={[
                    { value: "", label: "(skip)" },
                    ...dbFields.map((f) => ({
                      value: f,
                      label: FIELD_LABELS[f] ?? f,
                      disabled: assignedFields.has(f) && m.dbField !== f,
                    })),
                  ]}
                  value={m.dbField ?? ""}
                  onChange={(v) => onMappingChange(m.csvHeader, v || null)}
                  size="default"
                  placeholder="(skip)"
                  aria-label={`Map CSV column ${m.csvHeader}`}
                />
              </DataTableCell>
              <DataTableCell>
                {m.confidence ? (
                  <ConfidenceBadge level={m.confidence} />
                ) : (
                  <span className="text-xs text-[var(--rm-muted-subtle)]">
                    {m.dbField ? "Manual" : "Skipped"}
                  </span>
                )}
              </DataTableCell>
            </DataTableRow>
          ))}
        </tbody>
      </DataTable>

      {!nameIsMapped && (
        <div className="rounded-lg border border-[var(--rm-danger)]/30 bg-[var(--rm-danger)]/5 px-4 py-3 text-sm text-[var(--rm-danger)]">
          The <strong>Name</strong> field must be mapped to identify and deduplicate records.
        </div>
      )}

      <ModalFooter className="mt-8">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!nameIsMapped}>
          Preview import
        </Button>
      </ModalFooter>
    </div>
  );
}
