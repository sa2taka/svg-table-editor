import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_BORDER_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_TEXT_COLOR,
  ERROR_MESSAGES,
  FontFamily,
  FontWeight,
  TextAlign,
} from "./tableConstants.js";

// Re-export types and constants for convenience
export { DEFAULT_BORDER_COLOR, TRANSPARENT_COLOR } from "./tableConstants.js";
export type { FontFamily, FontWeight, TextAlign } from "./tableConstants.js";

export interface BorderStyle {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export interface GridBorderStyle {
  outer: BorderStyle;
  innerVertical: string;
  innerHorizontal: string;
}

export interface CellStyle {
  fontWeight: FontWeight;
  color: string;
  fontFamily: FontFamily;
  textAlign: TextAlign;
  backgroundColor: string;
  borderColor: BorderStyle;
}

export interface CellData {
  row: number;
  column: number;
  text: string;
  style: CellStyle;
  merged: boolean;
  rowSpan: number;
  colSpan: number;
  mainCellRow?: number;
  mainCellColumn?: number;
}

export interface TableDataModel {
  rows: number;
  columns: number;
  cells: CellData[][];
  gridStyle?: {
    innerVertical: string;
    innerHorizontal: string;
  };
}

const DEFAULT_BORDER_STYLE: BorderStyle = {
  top: DEFAULT_BORDER_COLOR,
  right: DEFAULT_BORDER_COLOR,
  bottom: DEFAULT_BORDER_COLOR,
  left: DEFAULT_BORDER_COLOR,
};

const DEFAULT_STYLE: CellStyle = {
  fontWeight: "normal",
  color: DEFAULT_TEXT_COLOR,
  fontFamily: DEFAULT_FONT_FAMILY,
  textAlign: "left",
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  borderColor: { ...DEFAULT_BORDER_STYLE },
};

export function createTable(rows: number, columns: number): TableDataModel {
  const cells: CellData[][] = [];

  for (let row = 0; row < rows; row++) {
    const rowCells: CellData[] = [];
    for (let col = 0; col < columns; col++) {
      rowCells.push({
        row,
        column: col,
        text: "",
        style: { ...DEFAULT_STYLE },
        merged: false,
        rowSpan: 1,
        colSpan: 1,
      });
    }
    cells.push(rowCells);
  }

  return {
    rows,
    columns,
    cells,
    gridStyle: {
      innerVertical: "#000000",
      innerHorizontal: "#000000",
    },
  };
}

export function getCell(table: TableDataModel, row: number, column: number): CellData {
  if (row < 0 || row >= table.rows || column < 0 || column >= table.columns) {
    throw new Error(ERROR_MESSAGES.INVALID_CELL_POSITION);
  }
  return table.cells[row][column];
}

export function setCellText(table: TableDataModel, row: number, column: number, text: string): TableDataModel {
  const newTable = cloneTable(table);
  newTable.cells[row][column].text = text;
  return newTable;
}

export function setCellStyle(table: TableDataModel, row: number, column: number, style: Partial<CellStyle>): TableDataModel {
  const newTable = cloneTable(table);
  const currentCell = newTable.cells[row][column];

  // Properly merge borderColor object
  if (style.borderColor) {
    currentCell.style = {
      ...currentCell.style,
      ...style,
      borderColor: {
        ...currentCell.style.borderColor,
        ...style.borderColor,
      },
    };

    // Sync adjacent cell borders to maintain consistency
    syncAdjacentBorders(newTable, row, column, style.borderColor);
  } else {
    currentCell.style = {
      ...currentCell.style,
      ...style,
    };
  }

  return newTable;
}

// Private utility functions for table operations

// Utility function to iterate over cells in a range
function forEachCellInRange(
  table: TableDataModel,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  callback: (cell: CellData, row: number, col: number) => void
): void {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      callback(table.cells[row][col], row, col);
    }
  }
}

// Validation functions for merge operations
function validateMergeRangeBounds(table: TableDataModel, startRow: number, startCol: number, endRow: number, endCol: number): void {
  if (startRow < 0 || startCol < 0 || endRow >= table.rows || endCol >= table.columns) {
    throw new Error(ERROR_MESSAGES.INVALID_MERGE_RANGE);
  }

  if (startRow > endRow || startCol > endCol) {
    throw new Error(ERROR_MESSAGES.MERGE_RANGE_START_BEFORE_END);
  }
}

function validateNoExistingMergedCells(table: TableDataModel, startRow: number, startCol: number, endRow: number, endCol: number): void {
  forEachCellInRange(table, startRow, startCol, endRow, endCol, (cell) => {
    if (cell.merged || cell.rowSpan > 1 || cell.colSpan > 1) {
      throw new Error(ERROR_MESSAGES.CANNOT_MERGE_EXISTING_MERGED_CELLS);
    }
  });
}

// Worker function for merge operations
function markSecondaryCellsAsMerged(table: TableDataModel, startRow: number, startCol: number, endRow: number, endCol: number): void {
  forEachCellInRange(table, startRow, startCol, endRow, endCol, (cell, row, col) => {
    if (row === startRow && col === startCol) {
      return; // Skip main cell
    }

    cell.merged = true;
    cell.mainCellRow = startRow;
    cell.mainCellColumn = startCol;
    cell.rowSpan = 1;
    cell.colSpan = 1;
  });
}

// 隣接セルの境界線を同期する関数
function syncAdjacentBorders(table: TableDataModel, row: number, column: number, borderColor: Partial<BorderStyle>): void {
  // 上のセル (row-1) の bottom を current の top と同期
  if (borderColor.top !== undefined && row > 0) {
    const topCell = table.cells[row - 1][column];
    topCell.style.borderColor.bottom = borderColor.top;
  }

  // 右のセル (column+1) の left を current の right と同期
  if (borderColor.right !== undefined && column < table.columns - 1) {
    const rightCell = table.cells[row][column + 1];
    rightCell.style.borderColor.left = borderColor.right;
  }

  // 下のセル (row+1) の top を current の bottom と同期
  if (borderColor.bottom !== undefined && row < table.rows - 1) {
    const bottomCell = table.cells[row + 1][column];
    bottomCell.style.borderColor.top = borderColor.bottom;
  }

  // 左のセル (column-1) の right を current の left と同期
  if (borderColor.left !== undefined && column > 0) {
    const leftCell = table.cells[row][column - 1];
    leftCell.style.borderColor.right = borderColor.left;
  }
}

export function mergeCells(table: TableDataModel, startRow: number, startCol: number, endRow: number, endCol: number): TableDataModel {
  const newTable = cloneTable(table);

  // Validate merge operation
  validateMergeRangeBounds(newTable, startRow, startCol, endRow, endCol);
  validateNoExistingMergedCells(newTable, startRow, startCol, endRow, endCol);

  // Calculate span values
  const rowSpan = endRow - startRow + 1;
  const colSpan = endCol - startCol + 1;

  // Configure main cell
  const mainCell = newTable.cells[startRow][startCol];
  mainCell.rowSpan = rowSpan;
  mainCell.colSpan = colSpan;
  mainCell.merged = false;

  // Mark secondary cells as merged
  markSecondaryCellsAsMerged(newTable, startRow, startCol, endRow, endCol);

  return newTable;
}

export function splitCells(table: TableDataModel, row: number, column: number): TableDataModel {
  const newTable = cloneTable(table);
  const cell = getCell(newTable, row, column);

  if (cell.merged) {
    // This is a merged cell, find the main cell
    if (cell.mainCellRow !== undefined && cell.mainCellColumn !== undefined) {
      return splitCells(newTable, cell.mainCellRow, cell.mainCellColumn);
    }
    throw new Error(ERROR_MESSAGES.INVALID_MERGED_CELL_REFERENCE);
  }

  if (cell.rowSpan === 1 && cell.colSpan === 1) {
    // Cell is not merged, nothing to split
    return newTable;
  }

  // Reset main cell
  cell.rowSpan = 1;
  cell.colSpan = 1;

  // Find and reset all merged cells
  for (let r = 0; r < newTable.rows; r++) {
    for (let c = 0; c < newTable.columns; c++) {
      const targetCell = newTable.cells[r][c];
      if (targetCell.merged && targetCell.mainCellRow === row && targetCell.mainCellColumn === column) {
        targetCell.merged = false;
        targetCell.mainCellRow = undefined;
        targetCell.mainCellColumn = undefined;
      }
    }
  }

  return newTable;
}

export function canMergeRange(table: TableDataModel, startRow: number, startCol: number, endRow: number, endCol: number): boolean {
  // Single cell cannot be merged
  if (startRow === endRow && startCol === endCol) {
    return false;
  }

  try {
    validateMergeRangeBounds(table, startRow, startCol, endRow, endCol);
    validateNoExistingMergedCells(table, startRow, startCol, endRow, endCol);
    return true;
  } catch {
    return false;
  }
}

export function canSplitCell(table: TableDataModel, row: number, column: number): boolean {
  try {
    const cell = getCell(table, row, column);
    return cell.merged || cell.rowSpan > 1 || cell.colSpan > 1;
  } catch {
    return false;
  }
}

export function getExpandedMergeRange(
  table: TableDataModel,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
} {
  let expandedStartRow = startRow;
  let expandedStartCol = startCol;
  let expandedEndRow = endRow;
  let expandedEndCol = endCol;

  // Expand the range to include all merged cells that overlap with the selection
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cell = table.cells[row][col];

      if (cell.merged && cell.mainCellRow !== undefined && cell.mainCellColumn !== undefined) {
        // This is a merged cell, expand to include its main cell and full range
        const mainCell = table.cells[cell.mainCellRow][cell.mainCellColumn];
        expandedStartRow = Math.min(expandedStartRow, cell.mainCellRow);
        expandedStartCol = Math.min(expandedStartCol, cell.mainCellColumn);
        expandedEndRow = Math.max(expandedEndRow, cell.mainCellRow + mainCell.rowSpan - 1);
        expandedEndCol = Math.max(expandedEndCol, cell.mainCellColumn + mainCell.colSpan - 1);
      } else if (cell.rowSpan > 1 || cell.colSpan > 1) {
        // This is a main merged cell, expand to include its full range
        expandedEndRow = Math.max(expandedEndRow, row + cell.rowSpan - 1);
        expandedEndCol = Math.max(expandedEndCol, col + cell.colSpan - 1);
      }
    }
  }

  return {
    startRow: expandedStartRow,
    startCol: expandedStartCol,
    endRow: expandedEndRow,
    endCol: expandedEndCol,
  };
}

export function mergeRangeWithExpansion(
  table: TableDataModel,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): TableDataModel {
  // First, split any existing merged cells in the range
  let newTable = cloneTable(table);

  const expandedRange = getExpandedMergeRange(newTable, startRow, startCol, endRow, endCol);

  // Split all merged cells in the expanded range
  for (let row = expandedRange.startRow; row <= expandedRange.endRow; row++) {
    for (let col = expandedRange.startCol; col <= expandedRange.endCol; col++) {
      const cell = newTable.cells[row][col];
      if (cell.merged || cell.rowSpan > 1 || cell.colSpan > 1) {
        newTable = splitCells(newTable, row, col);
      }
    }
  }

  // Now merge the expanded range
  return mergeCells(newTable, expandedRange.startRow, expandedRange.startCol, expandedRange.endRow, expandedRange.endCol);
}

export function addRow(table: TableDataModel, rowIndex: number): TableDataModel {
  const newTable = cloneTable(table);

  // Create new row with default cells
  const newRow: CellData[] = [];
  for (let col = 0; col < newTable.columns; col++) {
    newRow.push({
      row: rowIndex,
      column: col,
      text: "",
      style: { ...DEFAULT_STYLE, borderColor: { ...DEFAULT_BORDER_STYLE } },
      merged: false,
      rowSpan: 1,
      colSpan: 1,
    });
  }

  // Insert new row
  newTable.cells.splice(rowIndex, 0, newRow);
  newTable.rows++;

  // Update row indices for cells after the inserted row
  for (let row = rowIndex + 1; row < newTable.rows; row++) {
    for (let col = 0; col < newTable.columns; col++) {
      newTable.cells[row][col].row = row;

      // Update merged cell references
      const cell = newTable.cells[row][col];
      if (cell.mainCellRow !== undefined && cell.mainCellRow >= rowIndex) {
        cell.mainCellRow = cell.mainCellRow + 1;
      }
    }
  }

  return newTable;
}

export function removeRow(table: TableDataModel, rowIndex: number): TableDataModel {
  if (table.rows <= 1) {
    throw new Error(ERROR_MESSAGES.CANNOT_REMOVE_ROW_MIN_REQUIRED);
  }

  const newTable = cloneTable(table);

  // Check for merged cells that would be broken
  for (let col = 0; col < newTable.columns; col++) {
    const cell = newTable.cells[rowIndex][col];
    if (cell.rowSpan > 1 || (cell.merged && cell.mainCellRow !== rowIndex)) {
      throw new Error(ERROR_MESSAGES.CANNOT_REMOVE_ROW_CONTAINS_MERGED);
    }
  }

  // Remove row
  newTable.cells.splice(rowIndex, 1);
  newTable.rows--;

  // Update row indices for cells after the removed row
  for (let row = rowIndex; row < newTable.rows; row++) {
    for (let col = 0; col < newTable.columns; col++) {
      newTable.cells[row][col].row = row;

      // Update merged cell references
      const cell = newTable.cells[row][col];
      if (cell.mainCellRow !== undefined && cell.mainCellRow > rowIndex) {
        cell.mainCellRow = cell.mainCellRow - 1;
      }
    }
  }

  return newTable;
}

export function addColumn(table: TableDataModel, columnIndex: number): TableDataModel {
  const newTable = cloneTable(table);

  // Add new cell to each row
  for (let row = 0; row < newTable.rows; row++) {
    const newCell: CellData = {
      row,
      column: columnIndex,
      text: "",
      style: { ...DEFAULT_STYLE, borderColor: { ...DEFAULT_BORDER_STYLE } },
      merged: false,
      rowSpan: 1,
      colSpan: 1,
    };

    newTable.cells[row].splice(columnIndex, 0, newCell);
  }

  newTable.columns++;

  // Update column indices for cells after the inserted column
  for (let row = 0; row < newTable.rows; row++) {
    for (let col = columnIndex + 1; col < newTable.columns; col++) {
      newTable.cells[row][col].column = col;

      // Update merged cell references
      const cell = newTable.cells[row][col];
      if (cell.mainCellColumn !== undefined && cell.mainCellColumn >= columnIndex) {
        cell.mainCellColumn = cell.mainCellColumn + 1;
      }
    }
  }

  return newTable;
}

export function removeColumn(table: TableDataModel, columnIndex: number): TableDataModel {
  if (table.columns <= 1) {
    throw new Error(ERROR_MESSAGES.CANNOT_REMOVE_COLUMN_MIN_REQUIRED);
  }

  const newTable = cloneTable(table);

  // Check for merged cells that would be broken
  for (let row = 0; row < newTable.rows; row++) {
    const cell = newTable.cells[row][columnIndex];
    if (cell.colSpan > 1 || (cell.merged && cell.mainCellColumn !== columnIndex)) {
      throw new Error(ERROR_MESSAGES.CANNOT_REMOVE_COLUMN_CONTAINS_MERGED);
    }
  }

  // Remove column from each row
  for (let row = 0; row < newTable.rows; row++) {
    newTable.cells[row].splice(columnIndex, 1);
  }

  newTable.columns--;

  // Update column indices for cells after the removed column
  for (let row = 0; row < newTable.rows; row++) {
    for (let col = columnIndex; col < newTable.columns; col++) {
      newTable.cells[row][col].column = col;

      // Update merged cell references
      const cell = newTable.cells[row][col];
      if (cell.mainCellColumn !== undefined && cell.mainCellColumn > columnIndex) {
        cell.mainCellColumn = cell.mainCellColumn - 1;
      }
    }
  }

  return newTable;
}

function cloneTable(table: TableDataModel): TableDataModel {
  return {
    rows: table.rows,
    columns: table.columns,
    cells: table.cells.map((row) =>
      row.map((cell) => ({
        ...cell,
        style: {
          ...cell.style,
          borderColor: { ...cell.style.borderColor },
        },
      }))
    ),
    gridStyle: table.gridStyle ? { ...table.gridStyle } : undefined,
  };
}
