/**
 * TimelineHeader — persistent sticky header specification.
 *
 * These tests document the expected CSS classes that make the header row
 * stick to the top of the viewport while scrolling vertically.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimelineHeader } from "./TimelineHeader";

const weekRange = [
  new Date("2026-04-06"), // Mon
  new Date("2026-04-13"), // Mon
  new Date("2026-04-20"), // Mon
];

// ---------------------------------------------------------------------------
// Column labels
// ---------------------------------------------------------------------------

describe("TimelineHeader — column labels", () => {
  it("renders Project (first) and Resource (second) in by-project view", () => {
    const { container } = render(
      <table>
        <TimelineHeader view="project" weekRange={[]} />
      </table>,
    );
    const cells = container.querySelectorAll("th");
    expect(cells[0]).toHaveTextContent("Project");
    expect(cells[1]).toHaveTextContent("Resource");
  });

  it("renders Resource (first) and Project (second) in by-resource view", () => {
    const { container } = render(
      <table>
        <TimelineHeader view="resource" weekRange={[]} />
      </table>,
    );
    const cells = container.querySelectorAll("th");
    expect(cells[0]).toHaveTextContent("Resource");
    expect(cells[1]).toHaveTextContent("Project");
  });
});

// ---------------------------------------------------------------------------
// Week columns
// ---------------------------------------------------------------------------

describe("TimelineHeader — week columns", () => {
  it("renders exactly 2 label + N week th cells", () => {
    const { container } = render(
      <table>
        <TimelineHeader view="project" weekRange={weekRange} />
      </table>,
    );
    expect(container.querySelectorAll("th")).toHaveLength(2 + weekRange.length);
  });

  it("renders formatted week labels for each week in the range", () => {
    render(
      <table>
        <TimelineHeader view="project" weekRange={weekRange} />
      </table>,
    );
    // formatWeekLabel outputs e.g. "6 Apr", "13 Apr", "20 Apr"
    expect(screen.getByText("6 Apr")).toBeInTheDocument();
    expect(screen.getByText("13 Apr")).toBeInTheDocument();
    expect(screen.getByText("20 Apr")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Sticky CSS classes — required for persistent header to work
// ---------------------------------------------------------------------------

describe("TimelineHeader — sticky positioning classes", () => {
  it("first label th has sticky, top-0, and left-0 classes", () => {
    const { container } = render(
      <table>
        <TimelineHeader view="project" weekRange={weekRange} />
      </table>,
    );
    const firstTh = container.querySelectorAll("th")[0];
    expect(firstTh).toHaveClass("sticky");
    expect(firstTh).toHaveClass("top-0");
    expect(firstTh).toHaveClass("left-0");
  });

  it("second label th has sticky, top-0, and left-48 classes", () => {
    const { container } = render(
      <table>
        <TimelineHeader view="project" weekRange={weekRange} />
      </table>,
    );
    const secondTh = container.querySelectorAll("th")[1];
    expect(secondTh).toHaveClass("sticky");
    expect(secondTh).toHaveClass("top-0");
    expect(secondTh).toHaveClass("left-48");
  });

  it("week th cells all have sticky and top-0 classes", () => {
    const { container } = render(
      <table>
        <TimelineHeader view="project" weekRange={weekRange} />
      </table>,
    );
    const allThs = Array.from(container.querySelectorAll("th"));
    const weekThs = allThs.slice(2); // skip the two label columns
    expect(weekThs).toHaveLength(weekRange.length);
    for (const th of weekThs) {
      expect(th).toHaveClass("sticky");
      expect(th).toHaveClass("top-0");
    }
  });
});

// ---------------------------------------------------------------------------
// Current week highlighting
// ---------------------------------------------------------------------------

describe("TimelineHeader — current week highlight", () => {
  it("current week th has the primary accent border class", () => {
    // 2026-04-13 is the second week in our weekRange
    const { container } = render(
      <table>
        <TimelineHeader view="project" weekRange={weekRange} currentWeekKey="2026-04-13" />
      </table>,
    );
    const allThs = Array.from(container.querySelectorAll("th"));
    const currentTh = allThs[3]; // index 0=Project, 1=Resource, 2=04-06, 3=04-13 ← current
    expect(currentTh).toHaveClass("border-t-2");
  });

  it("non-current week ths do not have the accent border class", () => {
    const { container } = render(
      <table>
        <TimelineHeader view="project" weekRange={weekRange} currentWeekKey="2026-04-13" />
      </table>,
    );
    const allThs = Array.from(container.querySelectorAll("th"));
    const nonCurrentWeekThs = [allThs[2], allThs[4]]; // 04-06 and 04-20
    for (const th of nonCurrentWeekThs) {
      expect(th).not.toHaveClass("border-t-2");
    }
  });

  it("no week th has accent class when currentWeekKey is not in the range", () => {
    const { container } = render(
      <table>
        <TimelineHeader view="project" weekRange={weekRange} currentWeekKey="2025-01-01" />
      </table>,
    );
    const allThs = Array.from(container.querySelectorAll("th"));
    const weekThs = allThs.slice(2);
    for (const th of weekThs) {
      expect(th).not.toHaveClass("border-t-2");
    }
  });
});
