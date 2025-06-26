import { describe, expect, it } from "vitest";
import {
  createCellSelection,
  getSelectedCells,
  getSelectionBounds,
  isCellSelected,
  isValidSelection,
} from "../../src/models/CellSelection.js";

describe("CellSelection", () => {
  describe("createCellSelection", () => {
    it("should create a single cell selection", () => {
      const selection = createCellSelection(1, 2, 1, 2);

      expect(selection.startRow).toBe(1);
      expect(selection.startColumn).toBe(2);
      expect(selection.endRow).toBe(1);
      expect(selection.endColumn).toBe(2);
    });

    it("should create a multi-cell selection", () => {
      const selection = createCellSelection(0, 0, 2, 3);

      expect(selection.startRow).toBe(0);
      expect(selection.startColumn).toBe(0);
      expect(selection.endRow).toBe(2);
      expect(selection.endColumn).toBe(3);
    });

    it("should normalize coordinates when end is before start", () => {
      const selection = createCellSelection(2, 3, 0, 1);

      expect(selection.startRow).toBe(0);
      expect(selection.startColumn).toBe(1);
      expect(selection.endRow).toBe(2);
      expect(selection.endColumn).toBe(3);
    });
  });

  describe("isCellSelected", () => {
    it("should return true for cells within selection", () => {
      const selection = createCellSelection(1, 1, 3, 3);

      expect(isCellSelected(selection, 1, 1)).toBe(true);
      expect(isCellSelected(selection, 2, 2)).toBe(true);
      expect(isCellSelected(selection, 3, 3)).toBe(true);
      expect(isCellSelected(selection, 1, 3)).toBe(true);
      expect(isCellSelected(selection, 3, 1)).toBe(true);
    });

    it("should return false for cells outside selection", () => {
      const selection = createCellSelection(1, 1, 3, 3);

      expect(isCellSelected(selection, 0, 1)).toBe(false);
      expect(isCellSelected(selection, 1, 0)).toBe(false);
      expect(isCellSelected(selection, 4, 3)).toBe(false);
      expect(isCellSelected(selection, 3, 4)).toBe(false);
    });
  });

  describe("getSelectedCells", () => {
    it("should return all cells in selection range", () => {
      const selection = createCellSelection(1, 1, 2, 2);
      const cells = getSelectedCells(selection);

      expect(cells).toHaveLength(4);
      expect(cells).toContainEqual({ row: 1, column: 1 });
      expect(cells).toContainEqual({ row: 1, column: 2 });
      expect(cells).toContainEqual({ row: 2, column: 1 });
      expect(cells).toContainEqual({ row: 2, column: 2 });
    });

    it("should return single cell for single cell selection", () => {
      const selection = createCellSelection(2, 3, 2, 3);
      const cells = getSelectedCells(selection);

      expect(cells).toHaveLength(1);
      expect(cells[0]).toEqual({ row: 2, column: 3 });
    });
  });

  describe("isValidSelection", () => {
    it("should return true for valid selections within table bounds", () => {
      expect(isValidSelection(createCellSelection(0, 0, 2, 3), 5, 5)).toBe(true);
      expect(isValidSelection(createCellSelection(0, 0, 4, 4), 5, 5)).toBe(true);
    });

    it("should return false for selections outside table bounds", () => {
      expect(isValidSelection(createCellSelection(0, 0, 5, 3), 5, 5)).toBe(false);
      expect(isValidSelection(createCellSelection(0, 0, 3, 5), 5, 5)).toBe(false);
      expect(isValidSelection(createCellSelection(-1, 0, 2, 3), 5, 5)).toBe(false);
    });
  });

  describe("getSelectionBounds", () => {
    it("should return correct bounds for selection", () => {
      const selection = createCellSelection(1, 2, 3, 4);
      const bounds = getSelectionBounds(selection);

      expect(bounds).toEqual({
        minRow: 1,
        maxRow: 3,
        minColumn: 2,
        maxColumn: 4,
        rowCount: 3,
        columnCount: 3,
      });
    });

    it("should handle single cell selection", () => {
      const selection = createCellSelection(2, 2, 2, 2);
      const bounds = getSelectionBounds(selection);

      expect(bounds).toEqual({
        minRow: 2,
        maxRow: 2,
        minColumn: 2,
        maxColumn: 2,
        rowCount: 1,
        columnCount: 1,
      });
    });
  });
});
