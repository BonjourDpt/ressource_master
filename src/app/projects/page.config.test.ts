import { describe, expect, it } from "vitest";

describe("projects route config", () => {
  it("exports force-dynamic so the list is not a stale build-time snapshot", async () => {
    const mod = await import("./page");
    expect(mod.dynamic).toBe("force-dynamic");
  });
});
