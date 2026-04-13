/**
 * AllocationCell — no accent (inset) boxShadow on allocation buttons in any group mode.
 * The colored dot in the secondary column is owned by PlanningTableBody and is tested there.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AllocationCell } from "./AllocationCell";
import type {
  BookingWithRelations,
  PlanningEditingCell,
  PlanningMatrixGroup,
  PlanningMatrixRow,
  PlanningWeekCell,
} from "@/lib/planning-view-model";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/planning/actions", () => ({
  createBooking: vi.fn(),
  updateBooking: vi.fn(),
  deleteBooking: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeBooking(overrides: Partial<BookingWithRelations> = {}): BookingWithRelations {
  return {
    id: "booking-1",
    projectId: "project-1",
    resourceId: "resource-1",
    weekStart: new Date("2026-04-07"),
    allocationPct: 100,
    note: null,
    project: { id: "project-1", name: "Test Project", color: null },
    resource: { id: "resource-1", name: "Alice" },
    ...overrides,
  } as BookingWithRelations;
}

const weekStart = "2026-04-07";

function makeWeekCell(overrides: Partial<PlanningWeekCell> = {}): PlanningWeekCell {
  return {
    weekStart,
    allocationPercent: 100,
    booking: makeBooking(),
    ...overrides,
  };
}

function makeAllocationRow(overrides: Partial<PlanningMatrixRow> = {}): PlanningMatrixRow {
  return {
    id: "a:resource-1:project-1",
    rowType: "allocation",
    projectId: "project-1",
    resourceId: "resource-1",
    secondaryLabel: "Test Project",
    secondaryColor: null,
    weeks: [makeWeekCell()],
    ...overrides,
  };
}

function makeGroup(mode: PlanningMatrixGroup["mode"]): PlanningMatrixGroup {
  return {
    mode,
    groupId: "group-1",
    groupLabel: "Group",
    rows: [],
  };
}

const defaultHandlers = {
  onEditingCellChange: vi.fn(),
  onTabNavigate: vi.fn(),
};

// ---------------------------------------------------------------------------

describe("AllocationCell — allocation button has no accent boxShadow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("by-resource view with secondaryColor does not apply inset accent boxShadow", () => {
    const g = makeGroup("resource");
    const row = makeAllocationRow({ secondaryColor: "#FF0000" });
    const cell = makeWeekCell();
    const editingCell: PlanningEditingCell = null;

    render(
      <AllocationCell
        g={g}
        row={row}
        cell={cell}
        editingCell={editingCell}
        {...defaultHandlers}
      />,
    );

    const button = screen.getByRole("button", { name: /edit allocation/i });
    expect(button.style.boxShadow).toBeFalsy();
  });

  it("by-project view with secondaryColor does not apply inset accent boxShadow", () => {
    const g = makeGroup("project");
    const row = makeAllocationRow({ secondaryColor: "#00FF00" });
    const cell = makeWeekCell();
    const editingCell: PlanningEditingCell = null;

    render(
      <AllocationCell
        g={g}
        row={row}
        cell={cell}
        editingCell={editingCell}
        {...defaultHandlers}
      />,
    );

    const button = screen.getByRole("button", { name: /edit allocation/i });
    expect(button.style.boxShadow).toBeFalsy();
  });

  it("by-resource view without secondaryColor does not apply inset accent boxShadow", () => {
    const g = makeGroup("resource");
    const row = makeAllocationRow({ secondaryColor: null });
    const cell = makeWeekCell();
    const editingCell: PlanningEditingCell = null;

    render(
      <AllocationCell
        g={g}
        row={row}
        cell={cell}
        editingCell={editingCell}
        {...defaultHandlers}
      />,
    );

    const button = screen.getByRole("button", { name: /edit allocation/i });
    expect(button.style.boxShadow).toBeFalsy();
  });
});

describe("AllocationCell — secondary column colored dot", () => {
  /**
   * The project/resource accent dot in the 2nd column is rendered in PlanningTableBody,
   * not in AllocationCell; regression coverage lives with PlanningTableBody tests.
   */
  it("smoke: renders without error when a booking exists", () => {
    const g = makeGroup("resource");
    const row = makeAllocationRow({ secondaryColor: "#FF0000" });
    const cell = makeWeekCell();

    render(
      <AllocationCell
        g={g}
        row={row}
        cell={cell}
        editingCell={null}
        {...defaultHandlers}
      />,
    );

    expect(screen.getByRole("button", { name: /edit allocation/i })).toBeInTheDocument();
  });
});
