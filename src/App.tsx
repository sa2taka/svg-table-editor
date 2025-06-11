import { useState, useEffect, useCallback } from "react";
import { TableEditor } from "./components/TableEditor.js";
import { Toolbar } from "./components/Toolbar.js";
import { SVGPreviewModal } from "./components/SVGPreviewModal.js";
import { CellSelection, getSelectedCells, getSelectionBounds } from "./models/CellSelection.js";
import {
  addColumn,
  addRow,
  canMergeRange,
  canSplitCell,
  CellStyle,
  createTable,
  getCell,
  GridBorderStyle,
  mergeCells,
  mergeRangeWithExpansion,
  removeColumn,
  removeRow,
  setCellStyle,
  setCellText,
  splitCells,
  TableDataModel,
} from "./models/TableDataModel.js";
import { downloadSVG, exportTableToSVG } from "./utils/svgExporter.js";
import { 
  updateURLWithState, 
  getStateFromURL, 
  clearStateFromURL,
  AppState 
} from "./utils/urlStateManager.js";

const App = () => {
  const createInitialTable = (): TableDataModel => {
    const initialTable = createTable(4, 4);
    // Simple initial table with only one cell containing text
    const updatedTable = setCellText(initialTable, 0, 0, "Cell (1,1)");
    return updatedTable;
  };

  const [table, setTable] = useState<TableDataModel>(() => {
    // Try to load state from URL first
    try {
      const urlState = getStateFromURL();
      return urlState?.table ?? createInitialTable();
    } catch {
      return createInitialTable();
    }
  });

  const [selection, setSelection] = useState<CellSelection | null>(() => {
    // Try to load selection from URL first
    const urlState = getStateFromURL();
    return urlState?.selection ?? null;
  });

  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    svgContent: string;
  }>({
    isOpen: false,
    svgContent: "",
  });


  // Debounced URL update to avoid excessive URL changes
  const updateURL = useCallback(() => {
    const appState: AppState = { table, selection };
    updateURLWithState(appState);
  }, [table, selection]);

  // Update URL when state changes (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateURL();
    }, 1000); // 1 second delay

    return () => {
      clearTimeout(timeoutId);
    };
  }, [updateURL]);

  const handleCellChange = (row: number, column: number, value: string) => {
    setTable((prevTable) => setCellText(prevTable, row, column, value));
  };

  const handleCellClick = (_row: number, _column: number) => {
    // This will be handled by TableEditor's selection
  };

  const handleStyleChange = (style: Partial<CellStyle>) => {
    if (selection) {
      const selectedCells = getSelectedCells(selection);
      setTable((prevTable) => {
        let updatedTable = prevTable;
        selectedCells.forEach(({ row, column }) => {
          updatedTable = setCellStyle(updatedTable, row, column, style);
        });
        return updatedTable;
      });
    }
  };

  const handleExcelBorderChange = (gridBorder: GridBorderStyle) => {
    if (selection) {
      const selectedCells = getSelectedCells(selection);
      const bounds = getSelectionBounds(selection);

      setTable((prevTable) => {
        let updatedTable = { ...prevTable };

        // Update grid style for inner lines (preserve existing values)
        const currentGridStyle = updatedTable.gridStyle ?? {
          innerVertical: "#000000",
          innerHorizontal: "#000000",
        };

        updatedTable.gridStyle = {
          ...currentGridStyle,
          innerVertical: gridBorder.innerVertical,
          innerHorizontal: gridBorder.innerHorizontal,
        };

        // Apply borders to all cells in selection
        selectedCells.forEach(({ row, column }) => {
          const isTopEdge = row === bounds.minRow;
          const isBottomEdge = row === bounds.maxRow;
          const isLeftEdge = column === bounds.minColumn;
          const isRightEdge = column === bounds.maxColumn;

          const currentStyle = updatedTable.cells[row][column].style.borderColor;

          const borderStyle = {
            borderColor: {
              // Apply outer borders only to edges
              top: isTopEdge ? gridBorder.outer.top : currentStyle.top,
              right: isRightEdge ? gridBorder.outer.right : currentStyle.right,
              bottom: isBottomEdge ? gridBorder.outer.bottom : currentStyle.bottom,
              left: isLeftEdge ? gridBorder.outer.left : currentStyle.left,
            },
          };

          updatedTable = setCellStyle(updatedTable, row, column, borderStyle);
        });

        // Apply inner grid lines to internal borders
        for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
          for (let column = bounds.minColumn; column <= bounds.maxColumn; column++) {
            const isTopEdge = row === bounds.minRow;
            const isBottomEdge = row === bounds.maxRow;
            const isLeftEdge = column === bounds.minColumn;
            const isRightEdge = column === bounds.maxColumn;

            const currentStyle = updatedTable.cells[row][column].style.borderColor;

            const borderStyle = {
              borderColor: {
                // Keep outer borders as set above, apply inner grid lines to internal borders
                top: isTopEdge ? currentStyle.top : (updatedTable.gridStyle?.innerHorizontal ?? currentStyle.top),
                right: isRightEdge ? currentStyle.right : (updatedTable.gridStyle?.innerVertical ?? currentStyle.right),
                bottom: isBottomEdge ? currentStyle.bottom : (updatedTable.gridStyle?.innerHorizontal ?? currentStyle.bottom),
                left: isLeftEdge ? currentStyle.left : (updatedTable.gridStyle?.innerVertical ?? currentStyle.left),
              },
            };

            updatedTable = setCellStyle(updatedTable, row, column, borderStyle);
          }
        }

        return updatedTable;
      });
    }
  };

  const handleMergeCells = () => {
    if (selection) {
      const bounds = getSelectionBounds(selection);
      try {
        setTable((prevTable) => mergeCells(prevTable, bounds.minRow, bounds.minColumn, bounds.maxRow, bounds.maxColumn));
      } catch (error) {
        alert(`Cannot merge cells: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  };

  const handleSmartMerge = () => {
    if (selection) {
      const bounds = getSelectionBounds(selection);
      try {
        setTable((prevTable) => mergeRangeWithExpansion(prevTable, bounds.minRow, bounds.minColumn, bounds.maxRow, bounds.maxColumn));
      } catch (error) {
        alert(`Cannot merge cells: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  };

  const handleSplitCells = () => {
    if (selection) {
      const bounds = getSelectionBounds(selection);
      setTable((prevTable) => splitCells(prevTable, bounds.minRow, bounds.minColumn));
    }
  };

  const handleAddRow = () => {
    try {
      setTable((prevTable) => addRow(prevTable, prevTable.rows));
    } catch (error) {
      alert(`Cannot add row: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleRemoveRow = () => {
    try {
      setTable((prevTable) => removeRow(prevTable, prevTable.rows - 1));
      // Clear selection if it's outside the new table bounds
      if (selection && selection.endRow >= table.rows - 1) {
        setSelection(null);
      }
    } catch (error) {
      alert(`Cannot remove row: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleAddColumn = () => {
    try {
      setTable((prevTable) => addColumn(prevTable, prevTable.columns));
    } catch (error) {
      alert(`Cannot add column: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleRemoveColumn = () => {
    try {
      setTable((prevTable) => removeColumn(prevTable, prevTable.columns - 1));
      // Clear selection if it's outside the new table bounds
      if (selection && selection.endColumn >= table.columns - 1) {
        setSelection(null);
      }
    } catch (error) {
      alert(`Cannot remove column: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // 任意位置での行列操作
  const handleInsertRowAt = (index: number) => {
    try {
      setTable((prevTable) => addRow(prevTable, index));
      // 選択範囲を調整
      if (selection && selection.startRow >= index) {
        setSelection({
          ...selection,
          startRow: selection.startRow + 1,
          endRow: selection.endRow + 1,
        });
      }
    } catch (error) {
      alert(`Cannot insert row: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleRemoveRowAt = (index: number) => {
    try {
      setTable((prevTable) => removeRow(prevTable, index));
      // 選択範囲を調整
      if (selection) {
        if (selection.startRow > index) {
          setSelection({
            ...selection,
            startRow: selection.startRow - 1,
            endRow: selection.endRow - 1,
          });
        } else if (selection.startRow === index || selection.endRow === index) {
          setSelection(null); // 選択していた行が削除された場合
        }
      }
    } catch (error) {
      alert(`Cannot remove row: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleInsertColumnAt = (index: number) => {
    try {
      setTable((prevTable) => addColumn(prevTable, index));
      // 選択範囲を調整
      if (selection && selection.startColumn >= index) {
        setSelection({
          ...selection,
          startColumn: selection.startColumn + 1,
          endColumn: selection.endColumn + 1,
        });
      }
    } catch (error) {
      alert(`Cannot insert column: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleRemoveColumnAt = (index: number) => {
    try {
      setTable((prevTable) => removeColumn(prevTable, index));
      // 選択範囲を調整
      if (selection) {
        if (selection.startColumn > index) {
          setSelection({
            ...selection,
            startColumn: selection.startColumn - 1,
            endColumn: selection.endColumn - 1,
          });
        } else if (selection.startColumn === index || selection.endColumn === index) {
          setSelection(null); // 選択していた列が削除された場合
        }
      }
    } catch (error) {
      alert(`Cannot remove column: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleExportSVG = () => {
    try {
      const svgContent = exportTableToSVG(table, {
        cellWidth: 120,
        cellHeight: 28,
        fontSize: 14,
        fontFamily: "Arial, sans-serif",
        padding: 2,
        backgroundColor: "#ffffff",
        responsive: true,
        minCellWidth: 60,
        maxCellWidth: 300,
        minCellHeight: 20,
        maxCellHeight: 100,
        textMargin: 4,
      });

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const filename = `table-${timestamp}.svg`;

      downloadSVG(svgContent, filename);
    } catch (error) {
      alert(`Cannot export SVG: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handlePreviewSVG = () => {
    try {
      const svgContent = exportTableToSVG(table, {
        cellWidth: 120,
        cellHeight: 28,
        fontSize: 14,
        fontFamily: "Arial, sans-serif",
        padding: 2,
        backgroundColor: "#ffffff",
        responsive: true,
        minCellWidth: 60,
        maxCellWidth: 300,
        minCellHeight: 20,
        maxCellHeight: 100,
        textMargin: 4,
      });

      setPreviewModal({
        isOpen: true,
        svgContent,
      });
    } catch (error) {
      alert(`Cannot preview SVG: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handlePreviewClose = () => {
    setPreviewModal({
      isOpen: false,
      svgContent: "",
    });
  };

  const handlePreviewDownload = () => {
    if (previewModal.svgContent) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const filename = `table-${timestamp}.svg`;
      downloadSVG(previewModal.svgContent, filename);
    }
  };

  const handleNewTable = () => {
    if (confirm("Create a new table? This will clear the current table and URL state.")) {
      const newTable = createInitialTable();
      setTable(newTable);
      setSelection(null);
      clearStateFromURL();
    }
  };

  const handleClearURL = () => {
    if (confirm("Clear URL state? The table will remain but the URL will be reset.")) {
      clearStateFromURL();
    }
  };

  const canMerge = () => {
    if (!selection) return false;
    const bounds = getSelectionBounds(selection);
    return canMergeRange(table, bounds.minRow, bounds.minColumn, bounds.maxRow, bounds.maxColumn);
  };

  const canSplit = () => {
    if (!selection) return false;
    const bounds = getSelectionBounds(selection);
    return canSplitCell(table, bounds.minRow, bounds.minColumn);
  };

  const getSelectedCellStyle = (): CellStyle | undefined => {
    if (selection) {
      try {
        return getCell(table, selection.startRow, selection.startColumn).style;
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>SVG Table Editor</h1>
      <Toolbar
        selectedCellStyle={getSelectedCellStyle()}
        onStyleChange={handleStyleChange}
        onExcelBorderChange={handleExcelBorderChange}
        onMergeCells={handleMergeCells}
        onSplitCells={handleSplitCells}
        onSmartMerge={handleSmartMerge}
        onAddRow={handleAddRow}
        onRemoveRow={handleRemoveRow}
        onAddColumn={handleAddColumn}
        onRemoveColumn={handleRemoveColumn}
        onExportSVG={handleExportSVG}
        onPreviewSVG={handlePreviewSVG}
        onNewTable={handleNewTable}
        onClearURL={handleClearURL}
        canMerge={canMerge()}
        canSplit={canSplit()}
        tableSize={{ rows: table.rows, columns: table.columns }}
        currentGridStyle={table.gridStyle}
      />
      <div style={{ marginTop: "12px" }}>
        <TableEditor
          table={table}
          selection={selection}
          onCellChange={handleCellChange}
          onCellClick={handleCellClick}
          onSelectionChange={setSelection}
          onInsertRowAt={handleInsertRowAt}
          onRemoveRowAt={handleRemoveRowAt}
          onInsertColumnAt={handleInsertColumnAt}
          onRemoveColumnAt={handleRemoveColumnAt}
        />
      </div>
      {selection && (
        <div style={{ marginTop: "12px", color: "#666" }}>
          Selection: ({selection.startRow}, {selection.startColumn}) to ({selection.endRow}, {selection.endColumn})
          {getSelectionBounds(selection).rowCount > 1 || getSelectionBounds(selection).columnCount > 1
            ? ` - ${getSelectionBounds(selection).rowCount}×${getSelectionBounds(selection).columnCount} cells`
            : " - Single cell"}
        </div>
      )}

      <SVGPreviewModal
        isOpen={previewModal.isOpen}
        svgContent={previewModal.svgContent}
        onClose={handlePreviewClose}
        onDownload={handlePreviewDownload}
      />
    </div>
  );
};

export default App;
