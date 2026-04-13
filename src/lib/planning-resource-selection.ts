/**
 * Utilities for per-row selection in the by-resource planning view.
 * Selection toggles: clicking the selected row deselects it; clicking another selects it.
 */

export function toggleRowSelection(
  currentId: string | null,
  clickedId: string,
): string | null {
  return currentId === clickedId ? null : clickedId;
}

export function isResourceRowSelectable(row: { rowType: string }): boolean {
  return row.rowType === "allocation";
}
