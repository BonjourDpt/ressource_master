/**
 * PlanningTable — persistent sticky header structure tests.
 *
 * The date header row must always be visible when the user scrolls down
 * through many planning rows.
 *
 * Root cause of the pre-fix behavior: the single `overflow-x-auto` wrapper
 * around the whole table became the CSS scroll container, so `sticky top-0`
 * inside it had no effect for window-level vertical scrolling.
 *
 * Fix: split into two sibling containers —
 *   1. A `sticky top-14` header div (overflow-hidden, synced via JS)
 *   2. An `overflow-x-auto` body div (fires onScroll to sync the header)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { PlanningTable } from "./PlanningTable";
import type { PlanningTableProps } from "./PlanningTable";

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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const weekRange = [new Date("2026-04-06"), new Date("2026-04-13"), new Date("2026-04-20")];

function makeProps(overrides: Partial<PlanningTableProps> = {}): PlanningTableProps {
  return {
    view: "project",
    weekRange,
    groups: [],
    resWeekTotals: new Map(),
    projects: [],
    resources: [],
    editingCell: null,
    onEditingCellChange: vi.fn(),
    onTabNavigate: vi.fn(),
    onAddAllocationRow: vi.fn(),
    onDraftPairChange: vi.fn(),
    groupListEmpty: true,
    selectedProjectId: null,
    onToggleProjectSelection: vi.fn(),
    selectedResourceRowId: null,
    onToggleResourceRowSelection: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------

describe("PlanningTable — persistent sticky header structure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a sticky header container that is separate from the overflow-x-auto scroll body", () => {
    const { container } = render(<PlanningTable {...makeProps()} />);

    const stickyHeader = container.querySelector(".sticky.top-14");
    const scrollBody = container.querySelector(".overflow-x-auto");

    expect(stickyHeader).toBeInTheDocument();
    expect(scrollBody).toBeInTheDocument();
    // They must be distinct elements
    expect(stickyHeader).not.toBe(scrollBody);
  });

  it("sticky header container has top-14 offset to clear the app navigation bar", () => {
    const { container } = render(<PlanningTable {...makeProps()} />);
    const stickyHeader = container.querySelector(".sticky.top-14");
    expect(stickyHeader).toBeInTheDocument();
    expect(stickyHeader).toHaveClass("top-14");
  });

  it("thead lives inside the sticky header container, NOT inside the overflow-x-auto scroll body", () => {
    const { container } = render(<PlanningTable {...makeProps()} />);

    const stickyHeader = container.querySelector(".sticky.top-14");
    const scrollBody = container.querySelector(".overflow-x-auto");

    // thead must be in the sticky header
    expect(stickyHeader?.querySelector("thead")).not.toBeNull();

    // thead must NOT be in the scroll body
    expect(scrollBody?.querySelector("thead")).toBeNull();
  });

  it("tbody lives inside the overflow-x-auto scroll body, NOT inside the sticky header", () => {
    const { container } = render(
      <PlanningTable
        {...makeProps({
          groupListEmpty: false,
          groups: [
            {
              mode: "project",
              groupId: "p1",
              groupLabel: "Alpha",
              rows: [],
            },
          ],
        })}
      />,
    );

    const stickyHeader = container.querySelector(".sticky.top-14");
    const scrollBody = container.querySelector(".overflow-x-auto");

    expect(scrollBody?.querySelector("tbody")).not.toBeNull();
    expect(stickyHeader?.querySelector("tbody")).toBeNull();
  });

  it("header table and body table have the same number of colgroup columns", () => {
    const { container } = render(<PlanningTable {...makeProps()} />);

    const tables = container.querySelectorAll("table");
    expect(tables).toHaveLength(2);

    const headerCols = tables[0].querySelectorAll("col");
    const bodyCols = tables[1].querySelectorAll("col");

    // 2 label columns + 3 week columns
    expect(headerCols).toHaveLength(2 + weekRange.length);
    expect(bodyCols).toHaveLength(2 + weekRange.length);
  });

  it("sticky header container has overflow-hidden to hide the horizontal scrollbar", () => {
    const { container } = render(<PlanningTable {...makeProps()} />);
    const stickyHeader = container.querySelector(".sticky.top-14");
    expect(stickyHeader).toHaveClass("overflow-hidden");
  });

  it("renders week date labels inside the sticky header", () => {
    const { container } = render(<PlanningTable {...makeProps()} />);
    const stickyHeader = container.querySelector(".sticky.top-14");

    // formatWeekLabel("2026-04-06") → "6 Apr"
    expect(stickyHeader?.textContent).toContain("6 Apr");
    expect(stickyHeader?.textContent).toContain("13 Apr");
    expect(stickyHeader?.textContent).toContain("20 Apr");
  });

  it("renders Project and Resource column labels for by-project view", () => {
    const { container } = render(<PlanningTable {...makeProps({ view: "project" })} />);
    const stickyHeader = container.querySelector(".sticky.top-14");
    expect(stickyHeader?.textContent).toContain("Project");
    expect(stickyHeader?.textContent).toContain("Resource");
  });

  it("renders Resource and Project column labels for by-resource view", () => {
    const { container } = render(<PlanningTable {...makeProps({ view: "resource" })} />);
    const stickyHeader = container.querySelector(".sticky.top-14");
    expect(stickyHeader?.textContent).toContain("Resource");
    expect(stickyHeader?.textContent).toContain("Project");
  });
});
