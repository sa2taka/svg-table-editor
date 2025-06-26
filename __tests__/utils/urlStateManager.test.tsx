import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTable, setCellText } from "../../src/models/TableDataModel.js";
import {
  AppState,
  clearStateFromURL,
  deserializeStateFromURL,
  getStateFromURL,
  serializeStateToURL,
  updateURLWithState,
} from "../../src/utils/urlStateManager.js";

describe("URL State Manager", () => {
  let mockLocation: Location;
  let originalLocation: Location;
  let mockReplaceState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock window.location
    originalLocation = window.location;
    mockLocation = {
      href: "http://localhost:3000/",
      search: "",
    } as Location;
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    // Mock URL constructor
    (globalThis as { URL: new (url: string) => { searchParams: URLSearchParams; toString(): string } }).URL = class MockURL {
      public searchParams: URLSearchParams;

      constructor(url: string) {
        this.searchParams = new URLSearchParams(url.split("?")[1] || "");
      }

      toString() {
        const params = this.searchParams.toString();
        return `http://localhost:3000/${params ? `?${params}` : ""}`;
      }
    };

    // Mock window.history
    mockReplaceState = vi.fn();
    Object.defineProperty(window, "history", {
      value: {
        replaceState: mockReplaceState,
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  describe("serialization and deserialization", () => {
    it("should serialize and deserialize simple table state", () => {
      const table = createTable(2, 2);
      const state: AppState = {
        table,
        selection: null,
      };

      const serialized = serializeStateToURL(state);
      expect(serialized).toBeTypeOf("string");
      expect(serialized.length).toBeGreaterThan(0);

      const deserialized = deserializeStateFromURL(serialized);
      expect(deserialized).not.toBeNull();
      expect(deserialized?.table.rows).toBe(2);
      expect(deserialized?.table.columns).toBe(2);
      expect(deserialized?.selection).toBeNull();
    });

    it("should serialize and deserialize table with data", () => {
      let table = createTable(2, 2);
      table = setCellText(table, 0, 0, "Header 1");
      table = setCellText(table, 0, 1, "Header 2");
      table = setCellText(table, 1, 0, "Data 1");
      table = setCellText(table, 1, 1, "Data 2");

      const state: AppState = {
        table,
        selection: {
          startRow: 0,
          startColumn: 0,
          endRow: 1,
          endColumn: 1,
        },
      };

      const serialized = serializeStateToURL(state);
      const deserialized = deserializeStateFromURL(serialized);

      expect(deserialized).not.toBeNull();
      expect(deserialized?.table.cells[0][0].text).toBe("Header 1");
      expect(deserialized?.table.cells[0][1].text).toBe("Header 2");
      expect(deserialized?.table.cells[1][0].text).toBe("Data 1");
      expect(deserialized?.table.cells[1][1].text).toBe("Data 2");
      expect(deserialized?.selection?.startRow).toBe(0);
      expect(deserialized?.selection?.endRow).toBe(1);
    });

    it("should handle URL-safe encoding", () => {
      const table = createTable(1, 1);
      const state: AppState = { table, selection: null };

      const serialized = serializeStateToURL(state);

      // Should not contain URL-unsafe characters
      expect(serialized).not.toMatch(/[+/=]/);

      // Should deserialize correctly
      const deserialized = deserializeStateFromURL(serialized);
      expect(deserialized).not.toBeNull();
      expect(deserialized?.table.rows).toBe(1);
    });

    it("should handle invalid serialized data", () => {
      expect(deserializeStateFromURL("")).toBeNull();
      expect(deserializeStateFromURL("invalid-base64")).toBeNull();
      expect(deserializeStateFromURL("dmFsaWQtYmFzZTY0LWJ1dC1ub3QtanNvbg")).toBeNull(); // valid base64 but not JSON
    });

    it("should handle invalid state structure", () => {
      // Create a valid base64 string with invalid state
      const invalidState = btoa(JSON.stringify({ invalid: "structure" }));
      const urlSafeState = invalidState.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

      expect(deserializeStateFromURL(urlSafeState)).toBeNull();
    });
  });

  describe("URL operations", () => {
    it("should update URL with state", () => {
      const table = createTable(2, 2);
      const state: AppState = { table, selection: null };

      updateURLWithState(state);

      expect(mockReplaceState).toHaveBeenCalled();
    });

    it("should get state from URL", () => {
      const table = createTable(2, 2);
      const state: AppState = { table, selection: null };
      const serialized = serializeStateToURL(state);

      // Mock URL with state parameter
      mockLocation.href = `http://localhost:3000/?state=${serialized}`;
      mockLocation.search = `?state=${serialized}`;

      const retrievedState = getStateFromURL();
      expect(retrievedState).not.toBeNull();
      expect(retrievedState?.table.rows).toBe(2);
      expect(retrievedState?.table.columns).toBe(2);
    });

    it("should return null when no state in URL", () => {
      mockLocation.href = "http://localhost:3000/";
      mockLocation.search = "";

      const state = getStateFromURL();
      expect(state).toBeNull();
    });

    it("should clear state from URL", () => {
      clearStateFromURL();
      expect(mockReplaceState).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle serialization errors gracefully", () => {
      // Create a circular reference to cause JSON.stringify to fail
      const circularState = { table: null, selection: null } as unknown as AppState;
      circularState.table = circularState as unknown as AppState["table"];

      const result = serializeStateToURL(circularState);
      expect(result).toBe("");
    });

    it("should handle URL operations errors gracefully", () => {
      // Mock URL constructor to throw
      (globalThis as unknown as { URL: new () => { toString(): string } }).URL = class {
        constructor() {
          throw new Error("URL constructor failed");
        }
        toString() {
          return "";
        }
      };

      const table = createTable(1, 1);
      const state: AppState = { table, selection: null };

      // Should not throw
      updateURLWithState(state);

      const retrievedState = getStateFromURL();
      expect(retrievedState).toBeNull();

      clearStateFromURL();
    });
  });

  describe("compression effectiveness", () => {
    it("should significantly compress URL length compared to plain JSON", () => {
      // Create a table with some data to test compression
      let table = createTable(3, 3);
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          table = setCellText(table, row, col, `Cell (${row + 1},${col + 1}) with content`);
        }
      }

      const state: AppState = { table, selection: { startRow: 0, startColumn: 0, endRow: 2, endColumn: 2 } };

      // Simulate old method (JSON + Base64)
      const oldMethod = () => {
        const jsonString = JSON.stringify(state);
        const base64String = btoa(jsonString);
        return base64String.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      };

      const oldUrl = oldMethod();
      const newUrl = serializeStateToURL(state);

      console.log(`\n=== Compression Test ===`);
      console.log(`Old method: ${oldUrl.length} characters`);
      console.log(`New method: ${newUrl.length} characters`);
      console.log(`Compression: ${(((oldUrl.length - newUrl.length) / oldUrl.length) * 100).toFixed(1)}% smaller`);

      // New method should be significantly shorter
      expect(newUrl.length).toBeLessThan(oldUrl.length);
      expect(newUrl.length / oldUrl.length).toBeLessThan(0.5); // At least 50% smaller
    });
  });
});
