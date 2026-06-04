/**
 * Theme toggle: Dark <-> Light, persisted in localStorage.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY } from "@/lib/theme";
import { ThemeProvider } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";

function mockLocalStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  const ls = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
  vi.stubGlobal("localStorage", ls);
  return store;
}

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockLocalStorage();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("data-theme");
  });

  it("starts in dark mode with aria-pressed false", () => {
    renderToggle();
    const btn = screen.getByRole("button", { name: /switch to light mode/i });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("switches to light mode on click and persists preference", async () => {
    const user = userEvent.setup();
    const store = mockLocalStorage();
    renderToggle();

    await user.click(screen.getByRole("button", { name: /switch to light mode/i }));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(store.get(STORAGE_KEY)).toBe("light");
    expect(screen.getByRole("button", { name: /switch to dark mode/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("initializes from html data-theme when light is already applied", () => {
    document.documentElement.dataset.theme = "light";
    renderToggle();
    expect(screen.getByRole("button", { name: /switch to dark mode/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("returns to dark mode on second click", async () => {
    const user = userEvent.setup();
    const store = mockLocalStorage();
    renderToggle();

    await user.click(screen.getByRole("button", { name: /switch to light mode/i }));
    await user.click(screen.getByRole("button", { name: /switch to dark mode/i }));

    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(store.get(STORAGE_KEY)).toBe("dark");
    expect(screen.getByRole("button", { name: /switch to light mode/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
