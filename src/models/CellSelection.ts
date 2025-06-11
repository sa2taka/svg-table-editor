export interface CellSelection {
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
}

export interface CellPosition {
  row: number;
  column: number;
}

export interface SelectionBounds {
  minRow: number;
  maxRow: number;
  minColumn: number;
  maxColumn: number;
  rowCount: number;
  columnCount: number;
}

export const createCellSelection = (startRow: number, startColumn: number, endRow: number, endColumn: number): CellSelection => {
  // Normalize coordinates to ensure start is always top-left
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minColumn = Math.min(startColumn, endColumn);
  const maxColumn = Math.max(startColumn, endColumn);

  return {
    startRow: minRow,
    startColumn: minColumn,
    endRow: maxRow,
    endColumn: maxColumn,
  };
};

export const isCellSelected = (selection: CellSelection, row: number, column: number): boolean => {
  return row >= selection.startRow && row <= selection.endRow && column >= selection.startColumn && column <= selection.endColumn;
};

export const getSelectedCells = (selection: CellSelection): CellPosition[] => {
  const cells: CellPosition[] = [];

  for (let row = selection.startRow; row <= selection.endRow; row++) {
    for (let column = selection.startColumn; column <= selection.endColumn; column++) {
      cells.push({ row, column });
    }
  }

  return cells;
};

export const isValidSelection = (selection: CellSelection, tableRows: number, tableColumns: number): boolean => {
  return selection.startRow >= 0 && selection.startColumn >= 0 && selection.endRow < tableRows && selection.endColumn < tableColumns;
};

export const getSelectionBounds = (selection: CellSelection): SelectionBounds => {
  return {
    minRow: selection.startRow,
    maxRow: selection.endRow,
    minColumn: selection.startColumn,
    maxColumn: selection.endColumn,
    rowCount: selection.endRow - selection.startRow + 1,
    columnCount: selection.endColumn - selection.startColumn + 1,
  };
};

export const isSingleCellSelection = (selection: CellSelection): boolean => {
  return selection.startRow === selection.endRow && selection.startColumn === selection.endColumn;
};
