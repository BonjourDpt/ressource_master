import { describe, it, expect } from "vitest";
import { truncateNotePreview } from "./planning-note-utils";

describe("truncateNotePreview", () => {
  describe("short notes (≤ 25 characters)", () => {
    it("returns an empty string unchanged", () => {
      expect(truncateNotePreview("")).toBe("");
    });

    it("returns a single-character note unchanged", () => {
      expect(truncateNotePreview("A")).toBe("A");
    });

    it("returns a note of exactly 25 characters unchanged", () => {
      const note = "A".repeat(25);
      expect(truncateNotePreview(note)).toBe(note);
    });

    it("returns a short note unchanged", () => {
      expect(truncateNotePreview("On-site")).toBe("On-site");
    });

    it("returns a note of 24 characters unchanged", () => {
      const note = "B".repeat(24);
      expect(truncateNotePreview(note)).toBe(note);
    });
  });

  describe("long notes (> 25 characters)", () => {
    it("truncates a 26-character note and appends ellipsis", () => {
      const note = "A".repeat(26);
      const result = truncateNotePreview(note);
      expect(result).toBe("A".repeat(25) + "…");
    });

    it("truncates 'On-site training session' correctly", () => {
      const note = "On-site training session";
      // 24 chars — no truncation
      expect(truncateNotePreview(note)).toBe("On-site training session");
    });

    it("truncates 'On-site training sessions' (25 chars) — no truncation", () => {
      const note = "On-site training sessions";
      expect(truncateNotePreview(note)).toBe("On-site training sessions");
    });

    it("truncates 'On-site training sessions!' (26 chars) to 25 + ellipsis", () => {
      const note = "On-site training sessions!";
      expect(truncateNotePreview(note)).toBe("On-site training sessions…");
    });

    it("truncates a very long note to exactly 25 chars + ellipsis", () => {
      const note = "This is a very long planning note that exceeds the limit";
      const result = truncateNotePreview(note);
      expect(result).toHaveLength(26); // 25 chars + ellipsis character
      expect(result.endsWith("…")).toBe(true);
      expect(result.startsWith("This is a very long plann")).toBe(true);
    });

    it("the result always ends with '…' (unicode ellipsis, not three dots)", () => {
      const result = truncateNotePreview("X".repeat(50));
      expect(result).not.toMatch(/\.\.\.$/);
      expect(result).toMatch(/…$/);
    });
  });

  describe("custom maxLen parameter", () => {
    it("respects a custom maxLen of 10", () => {
      expect(truncateNotePreview("Hello World!", 10)).toBe("Hello Worl…");
    });

    it("does not truncate when text equals custom maxLen", () => {
      expect(truncateNotePreview("Hello", 5)).toBe("Hello");
    });
  });
});
