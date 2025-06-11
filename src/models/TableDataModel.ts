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
  fontWeight: "normal" | "bold";
  color: string;
  fontFamily: string;
  textAlign: "left" | "center" | "right";
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
  top: "#000000",
  right: "#000000",
  bottom: "#000000",
  left: "#000000",
};

const DEFAULT_STYLE: CellStyle = {
  fontWeight: "normal",
  color: "#000000",
  fontFamily: "Arial",
  textAlign: "left",
  backgroundColor: "transparent",
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
    throw new Error("Invalid cell position");
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
  newTable.cells[row][column].style = {
    ...newTable.cells[row][column].style,
    ...style,
  };
  return newTable;
}

export function mergeCells(table: TableDataModel, startRow: number, startCol: number, endRow: number, endCol: number): TableDataModel {
  const newTable = cloneTable(table);

  // Validate merge range
  if (startRow < 0 || startCol < 0 || endRow >= table.rows || endCol >= table.columns) {
    throw new Error("Invalid merge range");
  }

  if (startRow > endRow || startCol > endCol) {
    throw new Error("Invalid merge range: start must be before end");
  }

  // Check if any cells in the range are already merged
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cell = newTable.cells[row][col];
      if (cell.merged || cell.rowSpan > 1 || cell.colSpan > 1) {
        throw new Error("Cannot merge: range contains already merged cells");
      }
    }
  }

  const rowSpan = endRow - startRow + 1;
  const colSpan = endCol - startCol + 1;

  // Set main cell properties
  const mainCell = newTable.cells[startRow][startCol];
  mainCell.rowSpan = rowSpan;
  mainCell.colSpan = colSpan;
  mainCell.merged = false;

  // Mark other cells as merged
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      if (row === startRow && col === startCol) {
        continue; // Skip main cell
      }

      const cell = newTable.cells[row][col];
      cell.merged = true;
      cell.mainCellRow = startRow;
      cell.mainCellColumn = startCol;
      cell.rowSpan = 1;
      cell.colSpan = 1;
    }
  }

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
    throw new Error("Invalid merged cell: missing main cell reference");
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
  // Validate range bounds
  if (startRow < 0 || startCol < 0 || endRow >= table.rows || endCol >= table.columns) {
    return false;
  }

  if (startRow > endRow || startCol > endCol) {
    return false;
  }

  // Single cell cannot be merged
  if (startRow === endRow && startCol === endCol) {
    return false;
  }

  // Check if any cells in the range are already merged
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cell = table.cells[row][col];
      if (cell.merged || cell.rowSpan > 1 || cell.colSpan > 1) {
        return false;
      }
    }
  }

  return true;
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
    throw new Error("Cannot remove row: table must have at least one row");
  }

  const newTable = cloneTable(table);

  // Check for merged cells that would be broken
  for (let col = 0; col < newTable.columns; col++) {
    const cell = newTable.cells[rowIndex][col];
    if (cell.rowSpan > 1 || (cell.merged && cell.mainCellRow !== rowIndex)) {
      throw new Error("Cannot remove row: contains merged cells");
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
    throw new Error("Cannot remove column: table must have at least one column");
  }

  const newTable = cloneTable(table);

  // Check for merged cells that would be broken
  for (let row = 0; row < newTable.rows; row++) {
    const cell = newTable.cells[row][columnIndex];
    if (cell.colSpan > 1 || (cell.merged && cell.mainCellColumn !== columnIndex)) {
      throw new Error("Cannot remove column: contains merged cells");
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
