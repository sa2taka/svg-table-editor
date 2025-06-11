import { describe, expect, it } from "vitest";
import { addColumn, addRow, createTable, removeColumn, removeRow } from "../src/models/TableDataModel.js";

describe("Table Size Change", () => {
  describe("addRow", () => {
    it("should add a row at the specified index", () => {
      const table = createTable(2, 3);
      const newTable = addRow(table, 1);

      expect(newTable.rows).toBe(3);
      expect(newTable.columns).toBe(3);
      expect(newTable.cells).toHaveLength(3);
      expect(newTable.cells[1]).toHaveLength(3);
    });

    it("should update row indices correctly", () => {
      const table = createTable(2, 2);
      const newTable = addRow(table, 1);

      expect(newTable.cells[0][0].row).toBe(0);
      expect(newTable.cells[1][0].row).toBe(1);
      expect(newTable.cells[2][0].row).toBe(2);
    });

    it("should create cells with default style", () => {
      const table = createTable(1, 2);
      const newTable = addRow(table, 1);

      const newRowCell = newTable.cells[1][0];
      expect(newRowCell.text).toBe("");
      expect(newRowCell.merged).toBe(false);
      expect(newRowCell.rowSpan).toBe(1);
      expect(newRowCell.colSpan).toBe(1);
      expect(newRowCell.style.borderColor.top).toBe("#000000");
    });
  });

  describe("removeRow", () => {
    it("should remove a row at the specified index", () => {
      const table = createTable(3, 2);
      const newTable = removeRow(table, 1);

      expect(newTable.rows).toBe(2);
      expect(newTable.columns).toBe(2);
      expect(newTable.cells).toHaveLength(2);
    });

    it("should update row indices correctly after removal", () => {
      const table = createTable(3, 2);
      table.cells[0][0].text = "Row 0";
      table.cells[1][0].text = "Row 1";
      table.cells[2][0].text = "Row 2";

      const newTable = removeRow(table, 1);

      expect(newTable.cells[0][0].text).toBe("Row 0");
      expect(newTable.cells[1][0].text).toBe("Row 2");
      expect(newTable.cells[1][0].row).toBe(1);
    });

    it("should throw error when trying to remove the last row", () => {
      const table = createTable(1, 2);
      expect(() => removeRow(table, 0)).toThrow("Cannot remove row: table must have at least one row");
    });

    it("should throw error when row contains merged cells", () => {
      const table = createTable(3, 2);
      table.cells[1][0].rowSpan = 2;
      expect(() => removeRow(table, 1)).toThrow("Cannot remove row: contains merged cells");
    });
  });

  describe("addColumn", () => {
    it("should add a column at the specified index", () => {
      const table = createTable(2, 2);
      const newTable = addColumn(table, 1);

      expect(newTable.rows).toBe(2);
      expect(newTable.columns).toBe(3);
      expect(newTable.cells[0]).toHaveLength(3);
      expect(newTable.cells[1]).toHaveLength(3);
    });

    it("should update column indices correctly", () => {
      const table = createTable(2, 2);
      const newTable = addColumn(table, 1);

      expect(newTable.cells[0][0].column).toBe(0);
      expect(newTable.cells[0][1].column).toBe(1);
      expect(newTable.cells[0][2].column).toBe(2);
    });

    it("should create cells with default style", () => {
      const table = createTable(2, 1);
      const newTable = addColumn(table, 1);

      const newColumnCell = newTable.cells[0][1];
      expect(newColumnCell.text).toBe("");
      expect(newColumnCell.merged).toBe(false);
      expect(newColumnCell.rowSpan).toBe(1);
      expect(newColumnCell.colSpan).toBe(1);
      expect(newColumnCell.style.borderColor.top).toBe("#000000");
    });
  });

  describe("removeColumn", () => {
    it("should remove a column at the specified index", () => {
      const table = createTable(2, 3);
      const newTable = removeColumn(table, 1);

      expect(newTable.rows).toBe(2);
      expect(newTable.columns).toBe(2);
      expect(newTable.cells[0]).toHaveLength(2);
      expect(newTable.cells[1]).toHaveLength(2);
    });

    it("should update column indices correctly after removal", () => {
      const table = createTable(2, 3);
      table.cells[0][0].text = "Col 0";
      table.cells[0][1].text = "Col 1";
      table.cells[0][2].text = "Col 2";

      const newTable = removeColumn(table, 1);

      expect(newTable.cells[0][0].text).toBe("Col 0");
      expect(newTable.cells[0][1].text).toBe("Col 2");
      expect(newTable.cells[0][1].column).toBe(1);
    });

    it("should throw error when trying to remove the last column", () => {
      const table = createTable(2, 1);
      expect(() => removeColumn(table, 0)).toThrow("Cannot remove column: table must have at least one column");
    });

    it("should throw error when column contains merged cells", () => {
      const table = createTable(2, 3);
      table.cells[0][1].colSpan = 2;
      expect(() => removeColumn(table, 1)).toThrow("Cannot remove column: contains merged cells");
    });
  });

  describe("complex scenarios", () => {
    it("should handle adding multiple rows and columns", () => {
      let table = createTable(2, 2);
      table = addRow(table, 2);
      table = addColumn(table, 2);

      expect(table.rows).toBe(3);
      expect(table.columns).toBe(3);
    });

    it("should preserve existing cell data when adding rows/columns", () => {
      const table = createTable(2, 2);
      table.cells[0][0].text = "Original";
      table.cells[0][0].style.fontWeight = "bold";

      const newTable = addRow(table, 1);

      expect(newTable.cells[0][0].text).toBe("Original");
      expect(newTable.cells[0][0].style.fontWeight).toBe("bold");
    });
  });
});
