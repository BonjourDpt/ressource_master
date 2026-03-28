"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { cx } from "@/lib/cx";
import type { EntityType } from "@/lib/csv-mapping";

interface CsvUploadStepProps {
  entityType: EntityType;
  onEntityTypeChange: (t: EntityType) => void;
  onParsed: (headers: string[], rows: Record<string, string>[]) => void;
}

export function CsvUploadStep({
  entityType,
  onEntityTypeChange,
  onParsed,
}: CsvUploadStepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      setFileName(file.name);

      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete(results) {
          if (!results.meta.fields || results.meta.fields.length === 0) {
            setError("No columns detected. Make sure the file has a header row.");
            return;
          }
          if (results.data.length === 0) {
            setError("The file has headers but no data rows.");
            return;
          }
          onParsed(results.meta.fields, results.data);
        },
        error(err) {
          setError(`Failed to parse CSV: ${err.message}`);
        },
      });
    },
    [onParsed],
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-8">
      {/* Entity type selector */}
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--rm-muted)]">
          Import type
        </label>
        <SegmentedTabs
          tabs={[
            { value: "resource" as EntityType, label: "Resources" },
            { value: "project" as EntityType, label: "Projects" },
          ]}
          value={entityType}
          onChange={onEntityTypeChange}
          ariaLabel="Entity type"
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cx(
          "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 text-center transition-colors",
          dragging
            ? "border-[var(--rm-primary)] bg-[var(--rm-primary)]/5"
            : "border-[var(--rm-border)] bg-[var(--rm-surface)]",
        )}
      >
        <div className="text-4xl text-[var(--rm-muted-subtle)]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <div>
          <p className="text-sm text-[var(--rm-fg)]">
            Drag and drop a CSV file here
          </p>
          <p className="mt-1 text-xs text-[var(--rm-muted)]">
            or click to browse
          </p>
        </div>

        <Button
          variant="secondary"
          type="button"
          onClick={() => fileRef.current?.click()}
        >
          Choose file
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt"
          className="hidden"
          onChange={handleFile}
        />

        {fileName && !error && (
          <p className="text-xs text-[var(--rm-muted)]">
            Selected: <span className="text-[var(--rm-fg)]">{fileName}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--rm-danger)]/30 bg-[var(--rm-danger)]/5 px-4 py-3 text-sm text-[var(--rm-danger)]">
          {error}
        </div>
      )}
    </div>
  );
}
