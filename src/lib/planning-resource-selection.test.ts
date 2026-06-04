import { describe, it, expect } from "vitest";
import {
  toggleRowSelection,
  isResourceRowSelectable,
} from "@/lib/planning-resource-selection";

// ---------------------------------------------------------------------------
// toggleRowSelection
// ---------------------------------------------------------------------------

describe("toggleRowSelection", () => {
  describe("when no row is currently selected (currentId is null)", () => {
    it("selects the clicked row", () => {
      // Arrange
      const currentId = null;
      const clickedId = "row-1";

      // Act
      const result = toggleRowSelection(currentId, clickedId);

      // Assert
      expect(result).toBe("row-1");
    });
  });

  describe("when the clicked row is already selected", () => {
    it("deselects it by returning null", () => {
      // Arrange
      const currentId = "row-1";
      const clickedId = "row-1";

      // Act
      const result = toggleRowSelection(currentId, clickedId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("when a different row is currently selected", () => {
    it("switches selection to the clicked row", () => {
      // Arrange
      const currentId = "row-1";
      const clickedId = "row-2";

      // Act
      const result = toggleRowSelection(currentId, clickedId);

      // Assert
      expect(result).toBe("row-2");
    });
  });

  describe("edge cases", () => {
    it("handles IDs that share a common prefix without confusion", () => {
      // Arrange – "a:res1:proj1" vs "a:res1:proj10" must not match
      const currentId = "a:res1:proj1";
      const clickedId = "a:res1:proj10";

      // Act
      const result = toggleRowSelection(currentId, clickedId);

      // Assert
      expect(result).toBe("a:res1:proj10");
    });

    it("treats an empty-string currentId as a different value from the clicked ID", () => {
      // Arrange
      const currentId = "";
      const clickedId = "row-1";

      // Act
      const result = toggleRowSelection(currentId, clickedId);

      // Assert
      expect(result).toBe("row-1");
    });

    it("deselects when both currentId and clickedId are the same non-trivial composite key", () => {
      // Arrange
      const id = "a:resource-abc:project-xyz";
      const currentId = id;
      const clickedId = id;

      // Act
      const result = toggleRowSelection(currentId, clickedId);

      // Assert
      expect(result).toBeNull();
    });

    it("returns the new clickedId and not the previous one when switching", () => {
      // Arrange
      const currentId = "a:res1:proj1";
      const clickedId = "a:res1:proj2";

      // Act
      const result = toggleRowSelection(currentId, clickedId);

      // Assert
      expect(result).not.toBe(currentId);
      expect(result).toBe(clickedId);
    });
  });
});

// ---------------------------------------------------------------------------
// isResourceRowSelectable
// ---------------------------------------------------------------------------

describe("isResourceRowSelectable", () => {
  describe("allocation rows", () => {
    it("returns true for a row with rowType 'allocation'", () => {
      // Arrange
      const row = { rowType: "allocation" };

      // Act
      const result = isResourceRowSelectable(row);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("add rows", () => {
    it("returns false for a row with rowType 'add'", () => {
      // Arrange
      const row = { rowType: "add" };

      // Act
      const result = isResourceRowSelectable(row);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("summary rows", () => {
    it("returns false for a row with rowType 'summary'", () => {
      // Arrange
      const row = { rowType: "summary" };

      // Act
      const result = isResourceRowSelectable(row);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("unknown / unexpected row types", () => {
    it("returns false for an unrecognised rowType string", () => {
      // Arrange – guard against future rowType additions being accidentally selectable
      const row = { rowType: "header" };

      // Act
      const result = isResourceRowSelectable(row);

      // Assert
      expect(result).toBe(false);
    });

    it("returns false for an empty-string rowType", () => {
      // Arrange
      const row = { rowType: "" };

      // Act
      const result = isResourceRowSelectable(row);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("exhaustive coverage of all known PlanningRowType values", () => {
    const cases: Array<{ rowType: string; expected: boolean }> = [
      { rowType: "allocation", expected: true },
      { rowType: "add",        expected: false },
      { rowType: "summary",    expected: false },
    ];

    for (const { rowType, expected } of cases) {
      it(`rowType '${rowType}' → selectable: ${expected}`, () => {
        expect(isResourceRowSelectable({ rowType })).toBe(expected);
      });
    }
  });
});
