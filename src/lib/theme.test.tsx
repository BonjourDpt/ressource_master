import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_THEME,
  STORAGE_KEY,
  applyTheme,
  getStoredTheme,
} from "@/lib/theme";

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

describe("theme constants", () => {
  it("uses dark as the default theme", () => {
    expect(DEFAULT_THEME).toBe("dark");
  });

  it("uses rm-theme as the storage key", () => {
    expect(STORAGE_KEY).toBe("rm-theme");
  });
});

describe("getStoredTheme", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns dark when localStorage is empty", () => {
    expect(getStoredTheme()).toBe("dark");
  });

  it("returns dark for invalid stored values", () => {
    mockLocalStorage({ [STORAGE_KEY]: "hacked" });
    expect(getStoredTheme()).toBe("dark");
  });

  it("returns dark when stored value is dark", () => {
    mockLocalStorage({ [STORAGE_KEY]: "dark" });
    expect(getStoredTheme()).toBe("dark");
  });

  it("returns light when stored value is light", () => {
    mockLocalStorage({ [STORAGE_KEY]: "light" });
    expect(getStoredTheme()).toBe("light");
  });
});

describe("applyTheme", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("sets data-theme to light on the document element", () => {
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("removes data-theme when applying dark", () => {
    document.documentElement.dataset.theme = "light";
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});
