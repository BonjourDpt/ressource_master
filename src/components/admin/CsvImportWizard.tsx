"use client";

import { useCallback, useState } from "react";
import { cx } from "@/lib/cx";
import { Button } from "@/components/ui/Button";
import type { AutoMappingEntry, EntityType } from "@/lib/csv-mapping";
import { computeAutoMapping } from "@/lib/csv-mapping";
import { CsvUploadStep } from "./CsvUploadStep";
import { ColumnMappingStep } from "./ColumnMappingStep";
import { ImportPreviewStep } from "./ImportPreviewStep";

type Step = 1 | 2 | 3;

const STEP_LABELS = ["Upload", "Map columns", "Preview & import"] as const;

interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export function CsvImportWizard() {
  const [step, setStep] = useState<Step>(1);
  const [entityType, setEntityType] = useState<EntityType>("resource");
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<AutoMappingEntry[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleParsed = useCallback(
    (headers: string[], rows: Record<string, string>[]) => {
      setCsvRows(rows);
      const autoMap = computeAutoMapping(headers, entityType);
      setMappings(autoMap);
      setStep(2);
    },
    [entityType],
  );

  const handleMappingChange = useCallback(
    (csvHeader: string, dbField: string | null) => {
      setMappings((prev) => {
        const updated = prev.map((m) => {
          if (m.csvHeader === csvHeader) {
            return { ...m, dbField, confidence: null };
          }
          if (dbField && m.dbField === dbField && m.csvHeader !== csvHeader) {
            return { ...m, dbField: null, confidence: null };
          }
          return m;
        });
        return updated;
      });
    },
    [],
  );

  const handleDone = useCallback((result: ImportResult) => {
    setImportResult(result);
  }, []);

  const handleReset = () => {
    setStep(1);
    setCsvRows([]);
    setMappings([]);
    setImportResult(null);
  };

  if (importResult) {
    const hasErrors = importResult.errors.length > 0;
    return (
      <div className="space-y-6">
        <div
          className={cx(
            "rounded-xl border p-6 text-center",
            hasErrors && importResult.created === 0 && importResult.updated === 0
              ? "border-[var(--rm-danger)]/30 bg-[var(--rm-danger)]/5"
              : "border-emerald-500/30 bg-emerald-500/5",
          )}
        >
          <div className="text-lg font-semibold text-[var(--rm-fg)]">
            {hasErrors && importResult.created === 0 && importResult.updated === 0
              ? "Import failed"
              : "Import complete"}
          </div>
          <p className="mt-2 text-sm text-[var(--rm-muted)]">
            {importResult.created > 0 && (
              <span className="text-emerald-400">{importResult.created} created</span>
            )}
            {importResult.created > 0 && importResult.updated > 0 && " · "}
            {importResult.updated > 0 && (
              <span className="text-[var(--rm-primary-hover)]">{importResult.updated} updated</span>
            )}
          </p>
          {hasErrors && (
            <div className="mt-4 space-y-1 text-left">
              <p className="text-xs font-medium text-[var(--rm-danger)]">Errors:</p>
              {importResult.errors.slice(0, 10).map((err, i) => (
                <p key={i} className="text-xs text-[var(--rm-danger)]">
                  {err}
                </p>
              ))}
              {importResult.errors.length > 10 && (
                <p className="text-xs text-[var(--rm-muted)]">
                  ...and {importResult.errors.length - 10} more
                </p>
              )}
            </div>
          )}
        </div>
        <div className="text-center">
          <Button variant="secondary" onClick={handleReset}>
            Import another file
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <nav aria-label="Import progress" className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const stepNum = (i + 1) as Step;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={cx(
                    "h-px w-8",
                    isCompleted || isActive
                      ? "bg-[var(--rm-primary)]"
                      : "bg-[var(--rm-border)]",
                  )}
                />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={cx(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    isActive
                      ? "bg-[var(--rm-primary)] text-white"
                      : isCompleted
                        ? "bg-[var(--rm-primary)]/20 text-[var(--rm-primary-hover)]"
                        : "bg-[var(--rm-surface)] text-[var(--rm-muted)]",
                  )}
                >
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={cx(
                    "hidden text-sm sm:inline",
                    isActive
                      ? "font-medium text-[var(--rm-fg)]"
                      : "text-[var(--rm-muted)]",
                  )}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Step content */}
      {step === 1 && (
        <CsvUploadStep
          entityType={entityType}
          onEntityTypeChange={setEntityType}
          onParsed={handleParsed}
        />
      )}

      {step === 2 && (
        <ColumnMappingStep
          entityType={entityType}
          mappings={mappings}
          onMappingChange={handleMappingChange}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <ImportPreviewStep
          entityType={entityType}
          mappings={mappings}
          csvRows={csvRows}
          onBack={() => setStep(2)}
          onDone={handleDone}
        />
      )}
    </div>
  );
}
