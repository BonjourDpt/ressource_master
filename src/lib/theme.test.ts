import { describe, it, expect, beforeEach } from "vitest";
import {
  THEME_BOOTSTRAP_SCRIPT,
  THEME_STORAGE_KEY,
  parseThemeMode,
  readThemeFromStorage,
  writeThemeToStorage,
  resolveThemeForMount,
} from "./theme";

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
    clear: () => m.clear(),
    key: () => null,
    get length() {
      return m.size;
    },
  } as Storage;
}

describe("parseThemeMode", () => {
  it("accepts light and dark", () => {
    expect(parseThemeMode("light")).toBe("light");
    expect(parseThemeMode("dark")).toBe("dark");
  });

  it("returns null for invalid or empty", () => {
    expect(parseThemeMode(null)).toBeNull();
    expect(parseThemeMode("")).toBeNull();
    expect(parseThemeMode("system")).toBeNull();
    expect(parseThemeMode("LIGHT")).toBeNull();
  });
});

describe("readThemeFromStorage / writeThemeToStorage", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
  });

  it("round-trips a valid theme", () => {
    writeThemeToStorage(storage, "light");
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(readThemeFromStorage(storage)).toBe("light");
    writeThemeToStorage(storage, "dark");
    expect(readThemeFromStorage(storage)).toBe("dark");
  });

  it("returns null when key is missing", () => {
    expect(readThemeFromStorage(storage)).toBeNull();
  });

  it("returns null when value is corrupted", () => {
    storage.setItem(THEME_STORAGE_KEY, "garbage");
    expect(readThemeFromStorage(storage)).toBeNull();
  });
});

describe("resolveThemeForMount", () => {
  it("uses stored preference when present", () => {
    expect(resolveThemeForMount("light")).toBe("light");
    expect(resolveThemeForMount("dark")).toBe("dark");
  });

  it("defaults to dark when nothing stored", () => {
    expect(resolveThemeForMount(null)).toBe("dark");
  });
});

describe("THEME_BOOTSTRAP_SCRIPT", () => {
  it("references the storage key and theme values", () => {
    expect(THEME_BOOTSTRAP_SCRIPT).toContain(THEME_STORAGE_KEY);
    expect(THEME_BOOTSTRAP_SCRIPT).toContain("light");
    expect(THEME_BOOTSTRAP_SCRIPT).toContain("dark");
  });
});
