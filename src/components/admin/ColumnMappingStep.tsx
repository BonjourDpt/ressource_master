"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
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

      <div className="overflow-x-auto rounded-lg border border-[var(--rm-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--rm-border)] bg-[var(--rm-surface)]">
              <th className="px-4 py-3 text-left text-[13px] font-medium text-[var(--rm-muted)]">
                CSV column
              </th>
              <th className="px-4 py-3 text-left text-[13px] font-medium text-[var(--rm-muted)]">
                Maps to
              </th>
              <th className="px-4 py-3 text-left text-[13px] font-medium text-[var(--rm-muted)]">
                Confidence
              </th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((m) => (
              <tr
                key={m.csvHeader}
                className="border-b border-[var(--rm-border-subtle)] last:border-0"
              >
                <td className="px-4 py-3 font-mono text-xs text-[var(--rm-fg)]">
                  {m.csvHeader}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={m.dbField ?? ""}
                    onChange={(e) =>
                      onMappingChange(m.csvHeader, e.target.value || null)
                    }
                    className="w-full rounded-lg border border-[var(--rm-border)] bg-[var(--rm-surface)] px-3 py-2 text-sm text-[var(--rm-fg)] outline-none transition-colors focus:border-[var(--rm-primary)]"
                  >
                    <option value="">(skip)</option>
                    {dbFields.map((f) => (
                      <option
                        key={f}
                        value={f}
                        disabled={assignedFields.has(f) && m.dbField !== f}
                      >
                        {FIELD_LABELS[f] ?? f}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {m.confidence ? (
                    <ConfidenceBadge level={m.confidence} />
                  ) : (
                    <span className="text-xs text-[var(--rm-muted-subtle)]">
                      {m.dbField ? "Manual" : "Skipped"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!nameIsMapped && (
        <div className="rounded-lg border border-[var(--rm-danger)]/30 bg-[var(--rm-danger)]/5 px-4 py-3 text-sm text-[var(--rm-danger)]">
          The <strong>Name</strong> field must be mapped to identify and deduplicate records.
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!nameIsMapped}>
          Preview import
        </Button>
      </div>
    </div>
  );
}
