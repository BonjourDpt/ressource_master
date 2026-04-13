/**
 * PlanningTableBody — by-resource summary band (TDD).
 * These tests target the upcoming “resource summary band” layout; they should fail
 * against the pre-change implementation and pass once production code matches.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, within } from "@testing-library/react";
import { PlanningTableBody, type PlanningTableBodyProps } from "./PlanningTableBody";
import type { PlanningMatrixGroup } from "@/lib/planning-view-model";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/weeks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/weeks")>();
  return { ...mod, getCurrentWeekKey: vi.fn().mockReturnValue("2026-04-13") };
});

vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/planning/actions", () => ({
  createBooking: vi.fn(),
  updateBooking: vi.fn(),
  deleteBooking: vi.fn(),
}));

vi.mock("@/components/ui/Select", () => ({
  Select: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
    </select>
  ),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const weekRange = [new Date("2026-04-06"), new Date("2026-04-13")];

function makeResourceGroup(): PlanningMatrixGroup {
  return {
    mode: "resource",
    groupId: "r1",
    groupLabel: "Alice",
    rows: [
      {
        id: "a:r1:p1",
        rowType: "allocation",
        projectId: "p1",
        resourceId: "r1",
        secondaryLabel: "Alpha",
        secondaryColor: null,
        weeks: [
          { weekStart: "2026-04-06", allocationPercent: 50, booking: null },
          { weekStart: "2026-04-13", allocationPercent: 80, booking: null },
        ],
      },
      {
        id: "add:r1",
        rowType: "add",
        secondaryLabel: "",
        weeks: [
          { weekStart: "2026-04-06", allocationPercent: null, booking: null },
          { weekStart: "2026-04-13", allocationPercent: null, booking: null },
        ],
      },
      {
        id: "sum:r1",
        rowType: "summary",
        secondaryLabel: "Total",
        weeks: [],
      },
    ],
  };
}

function makeProjectGroup(): PlanningMatrixGroup {
  return {
    mode: "project",
    groupId: "p1",
    groupLabel: "Alpha",
    groupColor: null,
    rows: [
      {
        id: "a:p1:r1",
        rowType: "allocation",
        projectId: "p1",
        resourceId: "r1",
        secondaryLabel: "Alice",
        weeks: [
          { weekStart: "2026-04-06", allocationPercent: 50, booking: null },
          { weekStart: "2026-04-13", allocationPercent: 80, booking: null },
        ],
      },
      {
        id: "add:p1",
        rowType: "add",
        secondaryLabel: "",
        weeks: [
          { weekStart: "2026-04-06", allocationPercent: null, booking: null },
          { weekStart: "2026-04-13", allocationPercent: null, booking: null },
        ],
      },
    ],
  };
}

function makeProps(overrides: Partial<PlanningTableBodyProps> = {}): PlanningTableBodyProps {
  return {
    groups: [makeResourceGroup()],
    weekRange,
    resWeekTotals: new Map([
      ["r1:2026-04-06", 50],
      ["r1:2026-04-13", 80],
    ]),
    projects: [{ id: "p1", name: "Alpha", color: null, status: "ACTIVE" }],
    resources: [{ id: "r1", name: "Alice", status: "ACTIVE" }],
    editingCell: null,
    onEditingCellChange: vi.fn(),
    onTabNavigate: vi.fn(),
    onAddAllocationRow: vi.fn(),
    onDraftPairChange: vi.fn(),
    selectedProjectId: null,
    onToggleProjectSelection: vi.fn(),
    selectedResourceRowId: null,
    onToggleResourceRowSelection: vi.fn(),
    ...overrides,
  };
}

function renderTableBody(props: PlanningTableBodyProps) {
  return render(
    <table>
      <PlanningTableBody {...props} />
    </table>,
  );
}

// ---------------------------------------------------------------------------

describe("PlanningTableBody — By resource summary band", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an empty first sticky cell in the summary row (resource name is shown above)", () => {
    const { container } = renderTableBody(makeProps());
    const summaryRow = container.querySelector('tr[data-row-type="summary"]');
    expect(summaryRow).not.toBeNull();
    const firstTd = summaryRow!.querySelector("td");
    expect(firstTd).not.toBeNull();
    expect(firstTd!.textContent?.trim()).toBe("");
  });

  it("uses rowSpan N − 1 on the first group cell (excludes the summary row)", () => {
    const { container } = renderTableBody(makeProps());
    const tbody = container.querySelector('tbody[data-planning-group="r1"]');
    expect(tbody).not.toBeNull();
    const rowSpanTd = tbody!.querySelector("tr:first-child td[rowspan]");
    expect(rowSpanTd).not.toBeNull();
    const n = makeResourceGroup().rows.length;
    expect(rowSpanTd).toHaveAttribute("rowspan", String(n - 1));
  });

  it('labels the summary row’s second sticky column "Total allocation"', () => {
    const { container } = renderTableBody(makeProps());
    const summaryRow = container.querySelector('tr[data-row-type="summary"]');
    expect(summaryRow).not.toBeNull();
    const cells = summaryRow!.querySelectorAll("td");
    expect(cells.length).toBeGreaterThanOrEqual(2);
    expect(cells[1]).toHaveTextContent("Total allocation");
  });

  it("applies a distinct background treatment to the summary band (row or cells)", () => {
    const { container } = renderTableBody(makeProps());
    const summaryRow = container.querySelector('tr[data-row-type="summary"]') as HTMLTableRowElement;
    expect(summaryRow).not.toBeNull();
    const allSummaryClasses = [
      summaryRow.className,
      ...Array.from(summaryRow.querySelectorAll("td"), (td) => td.className),
    ].join(" ");
    expect(allSummaryClasses).toMatch(/surface-elevated|surface-muted|summary-band/);
  });

  it("applies a stronger top border on the summary row than the standard row divider", () => {
    const { container } = renderTableBody(makeProps());
    const summaryRow = container.querySelector('tr[data-row-type="summary"]') as HTMLTableRowElement;
    expect(summaryRow).not.toBeNull();
    expect(summaryRow.className).toMatch(/\bborder-t-(?:2|4|\[)/);
  });

  it("keeps the add row above the summary row in document order", () => {
    const { container } = renderTableBody(makeProps());
    const tbody = container.querySelector('tbody[data-planning-group="r1"]');
    expect(tbody).not.toBeNull();
    const rows = Array.from(tbody!.querySelectorAll("tr"));
    const addIdx = rows.findIndex((r) => r.getAttribute("data-row-type") === "add");
    const summaryIdx = rows.findIndex((r) => r.getAttribute("data-row-type") === "summary");
    expect(addIdx).toBeGreaterThanOrEqual(0);
    expect(summaryIdx).toBeGreaterThanOrEqual(0);
    expect(addIdx).toBeLessThan(summaryIdx);
  });

  it("does not render a summary row in by-project mode", () => {
    const { container } = renderTableBody(
      makeProps({
        groups: [makeProjectGroup()],
        resWeekTotals: new Map(),
      }),
    );
    expect(container.querySelector('tr[data-row-type="summary"]')).toBeNull();
  });

  it("still shows per-week totals in the summary row via TotalPctPill output", () => {
    const { container } = renderTableBody(makeProps());
    const summaryRow = container.querySelector('tr[data-row-type="summary"]');
    expect(summaryRow).not.toBeNull();
    const region = within(summaryRow as HTMLElement);
    expect(region.getByText("50%")).toBeInTheDocument();
    expect(region.getByText("80%")).toBeInTheDocument();
  });
});
