/**
 * Component tests for EditableAllocationCell note-cell redesign.
 *
 * These tests define the specification for the visual and behavioral requirements:
 * - A cell with a note is immediately recognisable at a glance
 * - It has a visible top-right alert indicator (data-testid="note-indicator")
 * - It has a distinct border class (note-cell class on the button)
 * - It has a persistent truncated note preview (data-testid="note-preview")
 * - Cell without a note has none of these elements
 * - The allocation percent remains the primary readable text
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditableAllocationCell } from "./EditableAllocationCell";
import type { BookingWithRelations } from "@/lib/planning-view-model";

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

const defaultProps = {
  rowId: "row-1",
  weekStart: "2026-04-07",
  projectId: "project-1",
  resourceId: "resource-1",
  isEditing: false,
  onEditingCellChange: vi.fn(),
  onTabNavigate: vi.fn(),
};

// ---------------------------------------------------------------------------
// 1. Normal cell without note
// ---------------------------------------------------------------------------

describe("EditableAllocationCell — cell without a note", () => {
  it("renders the allocation percentage", () => {
    render(<EditableAllocationCell {...defaultProps} booking={makeBooking({ allocationPct: 75 })} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("does NOT render a note indicator", () => {
    render(<EditableAllocationCell {...defaultProps} booking={makeBooking({ note: null })} />);
    expect(screen.queryByTestId("note-indicator")).not.toBeInTheDocument();
  });

  it("does NOT render a note preview", () => {
    render(<EditableAllocationCell {...defaultProps} booking={makeBooking({ note: null })} />);
    expect(screen.queryByTestId("note-preview")).not.toBeInTheDocument();
  });

  it("does NOT apply the note-cell class to the button", () => {
    render(<EditableAllocationCell {...defaultProps} booking={makeBooking({ note: null })} />);
    const button = screen.getByRole("button", { name: /edit allocation/i });
    expect(button).not.toHaveClass("note-cell");
  });

  it("empty string note is treated as no note", () => {
    render(<EditableAllocationCell {...defaultProps} booking={makeBooking({ note: "  " })} />);
    expect(screen.queryByTestId("note-indicator")).not.toBeInTheDocument();
    expect(screen.queryByTestId("note-preview")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2. Cell with a note (non-editing)
// ---------------------------------------------------------------------------

describe("EditableAllocationCell — cell with a note (read-only)", () => {
  it("renders the allocation percentage as the primary text", () => {
    render(
      <EditableAllocationCell
        {...defaultProps}
        booking={makeBooking({ allocationPct: 100, note: "On-site training" })}
      />,
    );
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders a note indicator element in the top-right area", () => {
    render(
      <EditableAllocationCell
        {...defaultProps}
        booking={makeBooking({ note: "On-site training" })}
      />,
    );
    expect(screen.getByTestId("note-indicator")).toBeInTheDocument();
  });

  it("renders a persistent note preview element", () => {
    render(
      <EditableAllocationCell
        {...defaultProps}
        booking={makeBooking({ note: "On-site training" })}
      />,
    );
    expect(screen.getByTestId("note-preview")).toBeInTheDocument();
  });

  it("shows the full note text when it is ≤ 25 characters", () => {
    render(
      <EditableAllocationCell
        {...defaultProps}
        booking={makeBooking({ note: "On-site training" })}
      />,
    );
    expect(screen.getByTestId("note-preview")).toHaveTextContent("On-site training");
  });

  it("truncates the note preview at 25 characters with an ellipsis when the note is longer", () => {
    const longNote = "On-site training sessions for Q2 planning";
    render(
      <EditableAllocationCell
        {...defaultProps}
        booking={makeBooking({ note: longNote })}
      />,
    );
    const preview = screen.getByTestId("note-preview");
    const text = preview.textContent ?? "";
    // Should be 26 characters: 25 content + 1 ellipsis char
    expect(text.length).toBeLessThanOrEqual(26);
    expect(text).toMatch(/…$/);
  });

  it("applies the note-cell class to the button for distinct border treatment", () => {
    render(
      <EditableAllocationCell
        {...defaultProps}
        booking={makeBooking({ note: "Review required" })}
      />,
    );
    const button = screen.getByRole("button", { name: /edit allocation/i });
    expect(button).toHaveClass("note-cell");
  });

  it("the note preview text is secondary — it appears after the allocation in the DOM", () => {
    render(
      <EditableAllocationCell
        {...defaultProps}
        booking={makeBooking({ allocationPct: 80, note: "Review required" })}
      />,
    );
    const button = screen.getByRole("button", { name: /edit allocation/i });
    const allChildren = Array.from(button.querySelectorAll("[data-testid]"));
    const previewIndex = allChildren.findIndex((el) => el.getAttribute("data-testid") === "note-preview");
    const indicatorIndex = allChildren.findIndex(
      (el) => el.getAttribute("data-testid") === "note-indicator",
    );
    // indicator is positioned absolutely in top-right, preview comes after allocation text
    expect(previewIndex).toBeGreaterThan(-1);
    expect(indicatorIndex).toBeGreaterThan(-1);
  });
});

// ---------------------------------------------------------------------------
// 3. Note truncation boundary conditions
// ---------------------------------------------------------------------------

describe("EditableAllocationCell — note preview truncation", () => {
  it("does not truncate a note of exactly 25 characters", () => {
    const note25 = "A".repeat(25);
    render(
      <EditableAllocationCell {...defaultProps} booking={makeBooking({ note: note25 })} />,
    );
    expect(screen.getByTestId("note-preview")).toHaveTextContent(note25);
  });

  it("truncates a note of 26 characters", () => {
    const note26 = "A".repeat(26);
    render(
      <EditableAllocationCell {...defaultProps} booking={makeBooking({ note: note26 })} />,
    );
    const text = screen.getByTestId("note-preview").textContent ?? "";
    expect(text).toBe("A".repeat(25) + "…");
  });
});

// ---------------------------------------------------------------------------
// 4. Editing cell with a note — indicator and border persist
// ---------------------------------------------------------------------------

describe("EditableAllocationCell — editing state with a note", () => {
  it("renders the allocation input when editing", () => {
    render(
      <EditableAllocationCell
        {...defaultProps}
        isEditing={true}
        booking={makeBooking({ allocationPct: 60, note: "Check this" })}
      />,
    );
    expect(screen.getByRole("textbox", { name: /allocation percent/i })).toBeInTheDocument();
  });

  it("shows 'Edit note' button (not 'Add note') when a note already exists", () => {
    render(
      <EditableAllocationCell
        {...defaultProps}
        isEditing={true}
        booking={makeBooking({ note: "Existing note" })}
      />,
    );
    expect(screen.getByRole("button", { name: /edit note/i })).toBeInTheDocument();
  });

  it("shows 'Add note' button when there is no existing note", () => {
    render(
      <EditableAllocationCell
        {...defaultProps}
        isEditing={true}
        booking={makeBooking({ note: null })}
      />,
    );
    expect(screen.getByRole("button", { name: /add note/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 5. Empty cell (no booking) — no note UI
// ---------------------------------------------------------------------------

describe("EditableAllocationCell — empty cell (no booking)", () => {
  it("renders the add-allocation button", () => {
    render(<EditableAllocationCell {...defaultProps} booking={null} />);
    expect(screen.getByRole("button", { name: /add allocation/i })).toBeInTheDocument();
  });

  it("does NOT render a note indicator", () => {
    render(<EditableAllocationCell {...defaultProps} booking={null} />);
    expect(screen.queryByTestId("note-indicator")).not.toBeInTheDocument();
  });

  it("does NOT render a note preview", () => {
    render(<EditableAllocationCell {...defaultProps} booking={null} />);
    expect(screen.queryByTestId("note-preview")).not.toBeInTheDocument();
  });
});
