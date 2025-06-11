import { describe, expect, it } from "vitest";
import {
  canMergeRange,
  canSplitCell,
  createTable,
  getCell,
  getExpandedMergeRange,
  mergeCells,
  mergeRangeWithExpansion,
  setCellStyle,
  setCellText,
  splitCells,
} from "../src/models/TableDataModel.js";

describe("TableDataModel", () => {
  describe("createTable", () => {
    it("should create a table with specified rows and columns", () => {
      const table = createTable(3, 4);

      expect(table.rows).toBe(3);
      expect(table.columns).toBe(4);
      expect(table.cells).toHaveLength(3);
      expect(table.cells[0]).toHaveLength(4);
    });

    it("should initialize cells with default values", () => {
      const table = createTable(2, 2);
      const cell = table.cells[0][0];

      expect(cell.text).toBe("");
      expect(cell.style.fontWeight).toBe("normal");
      expect(cell.style.color).toBe("#000000");
      expect(cell.style.fontFamily).toBe("Arial");
      expect(cell.style.textAlign).toBe("left");
      expect(cell.merged).toBe(false);
      expect(cell.rowSpan).toBe(1);
      expect(cell.colSpan).toBe(1);
    });
  });

  describe("getCell", () => {
    it("should return cell at specified position", () => {
      const table = createTable(3, 3);
      const cell = getCell(table, 1, 2);

      expect(cell).toBeDefined();
      expect(cell.row).toBe(1);
      expect(cell.column).toBe(2);
    });

    it("should throw error for invalid position", () => {
      const table = createTable(2, 2);

      expect(() => getCell(table, 2, 0)).toThrow("Invalid cell position");
      expect(() => getCell(table, 0, 2)).toThrow("Invalid cell position");
    });
  });

  describe("setCellText", () => {
    it("should update cell text", () => {
      const table = createTable(2, 2);
      const updatedTable = setCellText(table, 0, 1, "Test Text");

      expect(getCell(updatedTable, 0, 1).text).toBe("Test Text");
    });
  });

  describe("setCellStyle", () => {
    it("should update cell style properties", () => {
      const table = createTable(2, 2);
      const updatedTable = setCellStyle(table, 1, 0, {
        fontWeight: "bold",
        color: "#ff0000",
        textAlign: "center",
      });

      const cell = getCell(updatedTable, 1, 0);
      expect(cell.style.fontWeight).toBe("bold");
      expect(cell.style.color).toBe("#ff0000");
      expect(cell.style.textAlign).toBe("center");
    });
  });

  describe("mergeCells", () => {
    it("should merge cells horizontally", () => {
      const table = createTable(3, 3);
      const updatedTable = mergeCells(table, 0, 0, 0, 1);

      const mainCell = getCell(updatedTable, 0, 0);
      expect(mainCell.merged).toBe(false);
      expect(mainCell.colSpan).toBe(2);
      expect(mainCell.rowSpan).toBe(1);

      const mergedCell = getCell(updatedTable, 0, 1);
      expect(mergedCell.merged).toBe(true);
      expect(mergedCell.mainCellRow).toBe(0);
      expect(mergedCell.mainCellColumn).toBe(0);
    });

    it("should merge cells vertically", () => {
      const table = createTable(3, 3);
      const updatedTable = mergeCells(table, 1, 1, 2, 1);

      const mainCell = getCell(updatedTable, 1, 1);
      expect(mainCell.merged).toBe(false);
      expect(mainCell.rowSpan).toBe(2);
      expect(mainCell.colSpan).toBe(1);

      const mergedCell = getCell(updatedTable, 2, 1);
      expect(mergedCell.merged).toBe(true);
      expect(mergedCell.mainCellRow).toBe(1);
      expect(mergedCell.mainCellColumn).toBe(1);
    });

    it("should merge cells in a rectangle", () => {
      const table = createTable(4, 4);
      const updatedTable = mergeCells(table, 1, 1, 2, 2);

      const mainCell = getCell(updatedTable, 1, 1);
      expect(mainCell.rowSpan).toBe(2);
      expect(mainCell.colSpan).toBe(2);

      // Check all merged cells point to main cell
      expect(getCell(updatedTable, 1, 2).merged).toBe(true);
      expect(getCell(updatedTable, 2, 1).merged).toBe(true);
      expect(getCell(updatedTable, 2, 2).merged).toBe(true);
    });

    it("should throw error when trying to merge already merged cells", () => {
      const table = createTable(4, 4);
      const mergedTable = mergeCells(table, 0, 0, 1, 1);

      expect(() => mergeCells(mergedTable, 0, 0, 2, 2)).toThrow("Cannot merge: range contains already merged cells");
    });
  });

  describe("splitCells", () => {
    it("should split merged cells", () => {
      const table = createTable(3, 3);
      const mergedTable = mergeCells(table, 0, 0, 1, 1);
      const splitTable = splitCells(mergedTable, 0, 0);

      const mainCell = getCell(splitTable, 0, 0);
      expect(mainCell.rowSpan).toBe(1);
      expect(mainCell.colSpan).toBe(1);

      const previouslyMergedCell = getCell(splitTable, 0, 1);
      expect(previouslyMergedCell.merged).toBe(false);
      expect(previouslyMergedCell.mainCellRow).toBeUndefined();
      expect(previouslyMergedCell.mainCellColumn).toBeUndefined();
    });

    it("should work when called on a merged cell", () => {
      const table = createTable(3, 3);
      const mergedTable = mergeCells(table, 1, 1, 2, 2);
      const splitTable = splitCells(mergedTable, 1, 2); // Call on merged cell

      const mainCell = getCell(splitTable, 1, 1);
      expect(mainCell.rowSpan).toBe(1);
      expect(mainCell.colSpan).toBe(1);
    });

    it("should do nothing for non-merged cells", () => {
      const table = createTable(3, 3);
      const splitTable = splitCells(table, 1, 1);

      expect(splitTable).toEqual(table);
    });
  });

  describe("canMergeRange", () => {
    it("should return true for valid merge ranges", () => {
      const table = createTable(4, 4);

      expect(canMergeRange(table, 0, 0, 1, 1)).toBe(true);
      expect(canMergeRange(table, 1, 1, 2, 3)).toBe(true);
    });

    it("should return false for single cell", () => {
      const table = createTable(4, 4);

      expect(canMergeRange(table, 1, 1, 1, 1)).toBe(false);
    });

    it("should return false for ranges with merged cells", () => {
      const table = createTable(4, 4);
      const mergedTable = mergeCells(table, 0, 0, 1, 1);

      expect(canMergeRange(mergedTable, 0, 0, 2, 2)).toBe(false);
    });

    it("should return false for out of bounds ranges", () => {
      const table = createTable(3, 3);

      expect(canMergeRange(table, 0, 0, 3, 2)).toBe(false);
      expect(canMergeRange(table, -1, 0, 1, 1)).toBe(false);
    });
  });

  describe("canSplitCell", () => {
    it("should return true for merged cells", () => {
      const table = createTable(3, 3);
      const mergedTable = mergeCells(table, 0, 0, 1, 1);

      expect(canSplitCell(mergedTable, 0, 0)).toBe(true);
      expect(canSplitCell(mergedTable, 0, 1)).toBe(true);
    });

    it("should return false for normal cells", () => {
      const table = createTable(3, 3);

      expect(canSplitCell(table, 1, 1)).toBe(false);
    });
  });

  describe("getExpandedMergeRange", () => {
    it("should expand range to include full merged cells", () => {
      const table = createTable(5, 5);
      const mergedTable = mergeCells(table, 1, 1, 2, 2);

      const expandedRange = getExpandedMergeRange(mergedTable, 0, 0, 1, 1);

      expect(expandedRange).toEqual({
        startRow: 0,
        startCol: 0,
        endRow: 2,
        endCol: 2,
      });
    });

    it("should not expand for non-overlapping ranges", () => {
      const table = createTable(5, 5);
      const mergedTable = mergeCells(table, 3, 3, 4, 4);

      const expandedRange = getExpandedMergeRange(mergedTable, 0, 0, 1, 1);

      expect(expandedRange).toEqual({
        startRow: 0,
        startCol: 0,
        endRow: 1,
        endCol: 1,
      });
    });
  });

  describe("mergeRangeWithExpansion", () => {
    it("should merge range after splitting existing merged cells", () => {
      const table = createTable(4, 4);
      const mergedTable = mergeCells(table, 0, 0, 1, 1);
      const expandedMerge = mergeRangeWithExpansion(mergedTable, 0, 0, 2, 2);

      const mainCell = getCell(expandedMerge, 0, 0);
      expect(mainCell.rowSpan).toBe(3);
      expect(mainCell.colSpan).toBe(3);

      expect(getCell(expandedMerge, 1, 1).merged).toBe(true);
      expect(getCell(expandedMerge, 2, 2).merged).toBe(true);
    });
  });
});
