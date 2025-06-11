import { useState, useRef, useEffect } from "react";
import { CellSelection, createCellSelection, isCellSelected } from "../models/CellSelection.js";
import { CellData, TableDataModel } from "../models/TableDataModel.js";

interface TableEditorProps {
  table: TableDataModel;
  selection?: CellSelection | null;
  onCellClick?: (row: number, column: number) => void;
  onCellChange?: (row: number, column: number, value: string) => void;
  onSelectionChange?: (selection: CellSelection | null) => void;
  onInsertRowAt?: (index: number) => void;
  onRemoveRowAt?: (index: number) => void;
  onInsertColumnAt?: (index: number) => void;
  onRemoveColumnAt?: (index: number) => void;
}

interface EditingCell {
  row: number;
  column: number;
}

export const TableEditor = ({ 
  table, 
  selection, 
  onCellClick, 
  onCellChange, 
  onSelectionChange,
  onInsertRowAt,
  onRemoveRowAt,
  onInsertColumnAt,
  onRemoveColumnAt
}: TableEditorProps) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ row: number; column: number } | null>(null);
  const [isComposing, setIsComposing] = useState(false); // IME変換中フラグ
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    type: 'row' | 'column';
    index: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // コンテキストメニューの外側クリック検出
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCellClick = (row: number, column: number) => {
    setContextMenu(null); // コンテキストメニューを閉じる
    
    if (onCellClick) {
      onCellClick(row, column);
    }

    // Create single cell selection
    if (onSelectionChange) {
      onSelectionChange(createCellSelection(row, column, row, column));
    }
  };

  const handleRowHeaderRightClick = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'row',
      index: rowIndex
    });
  };

  const handleColumnHeaderRightClick = (e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'column',
      index: columnIndex
    });
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;

    const { type, index } = contextMenu;
    
    switch (action) {
      case 'insertBefore':
        if (type === 'row' && onInsertRowAt) {
          onInsertRowAt(index);
        } else if (type === 'column' && onInsertColumnAt) {
          onInsertColumnAt(index);
        }
        break;
      case 'insertAfter':
        if (type === 'row' && onInsertRowAt) {
          onInsertRowAt(index + 1);
        } else if (type === 'column' && onInsertColumnAt) {
          onInsertColumnAt(index + 1);
        }
        break;
      case 'remove':
        if (type === 'row' && onRemoveRowAt) {
          onRemoveRowAt(index);
        } else if (type === 'column' && onRemoveColumnAt) {
          onRemoveColumnAt(index);
        }
        break;
    }
    
    setContextMenu(null);
  };

  const handleMouseDown = (row: number, column: number) => {
    setIsDragging(true);
    setDragStart({ row, column });

    // Start with single cell selection
    if (onSelectionChange) {
      onSelectionChange(createCellSelection(row, column, row, column));
    }
  };

  const handleMouseEnter = (row: number, column: number) => {
    if (isDragging && dragStart && onSelectionChange) {
      // Update selection as user drags
      onSelectionChange(createCellSelection(dragStart.row, dragStart.column, row, column));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleCellDoubleClick = (row: number, column: number, currentValue: string) => {
    setEditingCell({ row, column });
    setEditValue(currentValue);
  };

  const handleEditConfirm = () => {
    if (editingCell && onCellChange) {
      onCellChange(editingCell.row, editingCell.column, editValue);
      setEditingCell(null);
      setEditValue("");
    }
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // IME変換状態管理
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // セル間のナビゲーション
  const navigateToCell = (fromRow: number, fromCol: number, direction: "up" | "down" | "left" | "right") => {
    let newRow = fromRow;
    let newCol = fromCol;

    switch (direction) {
      case "up":
        newRow = Math.max(0, fromRow - 1);
        break;
      case "down":
        newRow = Math.min(table.rows - 1, fromRow + 1);
        break;
      case "left":
        newCol = Math.max(0, fromCol - 1);
        break;
      case "right":
        newCol = Math.min(table.columns - 1, fromCol + 1);
        break;
    }

    if (onSelectionChange) {
      onSelectionChange(createCellSelection(newRow, newCol, newRow, newCol));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME変換中はキー操作を無視
    if (isComposing) {
      return;
    }

    if (e.key === "Enter") {
      if (editingCell) {
        // 編集中の場合、確定して下のセルに移動
        handleEditConfirm();
        if (!e.shiftKey) {
          navigateToCell(editingCell.row, editingCell.column, "down");
        } else {
          navigateToCell(editingCell.row, editingCell.column, "up");
        }
      } else if (selection) {
        // 編集中でない場合、選択されたセルの編集を開始
        const cell = table.cells[selection.startRow][selection.startColumn];
        setEditingCell({ row: selection.startRow, column: selection.startColumn });
        setEditValue(cell.text);
      }
      e.preventDefault();
    } else if (e.key === "Tab") {
      if (editingCell) {
        // 編集中の場合、確定して横のセルに移動
        handleEditConfirm();
        if (!e.shiftKey) {
          navigateToCell(editingCell.row, editingCell.column, "right");
        } else {
          navigateToCell(editingCell.row, editingCell.column, "left");
        }
      } else if (selection) {
        // 編集中でない場合、横のセルに移動
        if (!e.shiftKey) {
          navigateToCell(selection.startRow, selection.startColumn, "right");
        } else {
          navigateToCell(selection.startRow, selection.startColumn, "left");
        }
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      if (editingCell) {
        handleEditCancel();
      }
      e.preventDefault();
    } else if (e.key === "ArrowUp" && selection && !editingCell) {
      navigateToCell(selection.startRow, selection.startColumn, "up");
      e.preventDefault();
    } else if (e.key === "ArrowDown" && selection && !editingCell) {
      navigateToCell(selection.startRow, selection.startColumn, "down");
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && selection && !editingCell) {
      navigateToCell(selection.startRow, selection.startColumn, "left");
      e.preventDefault();
    } else if (e.key === "ArrowRight" && selection && !editingCell) {
      navigateToCell(selection.startRow, selection.startColumn, "right");
      e.preventDefault();
    }
  };

  const renderCell = (cell: CellData, rowIndex: number, colIndex: number) => {
    // Skip rendering merged cells
    if (cell.merged) {
      return null;
    }

    const isEditing = editingCell !== null && editingCell.row === rowIndex && editingCell.column === colIndex;
    const isSelected = selection ? isCellSelected(selection, rowIndex, colIndex) : false;

    const backgroundColorValue = cell.style.backgroundColor === "transparent" ? "transparent" : cell.style.backgroundColor;
    const displayBackgroundColor = isSelected
      ? backgroundColorValue === "transparent"
        ? "#e3f2fd"
        : `color-mix(in srgb, ${backgroundColorValue} 70%, #e3f2fd 30%)`
      : backgroundColorValue;

    // Excel-style border logic for multi-selection
    const getExcelBorderStyle = (side: "top" | "right" | "bottom" | "left", color: string) => {
      if (!selection) {
        return color === "transparent" ? "1px solid transparent" : `1px solid ${color}`;
      }

      const isOnOuterEdge = {
        top: rowIndex === selection.startRow,
        right: colIndex === selection.endColumn,
        bottom: rowIndex === selection.endRow,
        left: colIndex === selection.startColumn,
      };

      // If this cell is selected
      if (isSelected) {
        // If it's on the outer edge of selection, use outer border style
        if (isOnOuterEdge[side]) {
          return color === "transparent" ? "2px solid #007bff" : `2px solid ${color}`;
        } else {
          // Inner grid lines - use table's grid style if available
          let innerColor = color;
          if (table.gridStyle) {
            if ((side === "left" || side === "right") && table.gridStyle.innerVertical !== "transparent") {
              innerColor = table.gridStyle.innerVertical;
            } else if ((side === "top" || side === "bottom") && table.gridStyle.innerHorizontal !== "transparent") {
              innerColor = table.gridStyle.innerHorizontal;
            }
          }

          const finalColor = innerColor === "transparent" ? "#ccc" : innerColor;
          return `1px solid ${finalColor}`;
        }
      } else {
        // Not selected, use normal border
        return color === "transparent" ? "1px solid transparent" : `1px solid ${color}`;
      }
    };

    const cellStyle = {
      fontWeight: cell.style.fontWeight,
      color: cell.style.color,
      fontFamily: cell.style.fontFamily,
      textAlign: cell.style.textAlign,
      borderTop: getExcelBorderStyle("top", cell.style.borderColor.top),
      borderRight: getExcelBorderStyle("right", cell.style.borderColor.right),
      borderBottom: getExcelBorderStyle("bottom", cell.style.borderColor.bottom),
      borderLeft: getExcelBorderStyle("left", cell.style.borderColor.left),
      backgroundColor: displayBackgroundColor,
      padding: "2px",
      minWidth: "80px",
      minHeight: "20px",
      position: "relative" as const,
      userSelect: "none" as const,
    };

    const cellProps = {
      style: cellStyle,
      role: "gridcell",
      onClick: () => {
        handleCellClick(rowIndex, colIndex);
      },
      onDoubleClick: () => {
        handleCellDoubleClick(rowIndex, colIndex, cell.text);
      },
      onMouseDown: () => {
        handleMouseDown(rowIndex, colIndex);
      },
      onMouseEnter: () => {
        handleMouseEnter(rowIndex, colIndex);
      },
      onMouseUp: handleMouseUp,
      ...(cell.colSpan > 1 && { colSpan: cell.colSpan }),
      ...(cell.rowSpan > 1 && { rowSpan: cell.rowSpan }),
    };

    return (
      <td key={`${rowIndex}-${colIndex}`} {...cellProps}>
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onBlur={handleEditConfirm}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: "inherit",
            }}
          />
        ) : (
          cell.text
        )}
      </td>
    );
  };

  const headerStyle = {
    backgroundColor: "#f8f9fa",
    border: "1px solid #dee2e6",
    padding: "4px 8px",
    textAlign: "center" as const,
    fontWeight: "bold",
    fontSize: "12px",
    minWidth: "30px",
    cursor: "pointer",
    userSelect: "none" as const,
  };

  return (
    <div 
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ outline: "none", position: "relative" }}
      role="grid"
      aria-label="Table editor"
    >
      <table style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {/* 左上の空のセル */}
            <th style={headerStyle}></th>
            {/* 列番号ヘッダー */}
            {Array.from({ length: table.columns }, (_, i) => (
              <th 
                key={`col-${i}`} 
                style={headerStyle}
                onContextMenu={(e) => {
                  handleColumnHeaderRightClick(e, i);
                }}
                title={`Column ${i + 1} - Right click for options`}
              >
                {String.fromCharCode(65 + i)} {/* A, B, C... */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.cells.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {/* 行番号ヘッダー */}
              <th 
                style={headerStyle}
                onContextMenu={(e) => {
                  handleRowHeaderRightClick(e, rowIndex);
                }}
                title={`Row ${rowIndex + 1} - Right click for options`}
              >
                {rowIndex + 1}
              </th>
              {/* テーブルセル */}
              {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* コンテキストメニュー */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 1000,
            minWidth: "150px",
          }}
        >
          <div 
            role="button"
            tabIndex={0}
            style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
            onClick={() => {
              handleContextMenuAction('insertBefore');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleContextMenuAction('insertBefore');
              }
            }}
          >
            Insert {contextMenu.type} before
          </div>
          <div 
            role="button"
            tabIndex={0}
            style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
            onClick={() => {
              handleContextMenuAction('insertAfter');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleContextMenuAction('insertAfter');
              }
            }}
          >
            Insert {contextMenu.type} after
          </div>
          <div 
            role="button"
            tabIndex={0}
            style={{ 
              padding: "8px 12px", 
              cursor: "pointer", 
              color: (contextMenu.type === 'row' && table.rows <= 1) || (contextMenu.type === 'column' && table.columns <= 1) ? "#ccc" : "#dc3545"
            }}
            onClick={() => {
              if ((contextMenu.type === 'row' && table.rows > 1) || (contextMenu.type === 'column' && table.columns > 1)) {
                handleContextMenuAction('remove');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if ((contextMenu.type === 'row' && table.rows > 1) || (contextMenu.type === 'column' && table.columns > 1)) {
                  handleContextMenuAction('remove');
                }
              }
            }}
          >
            Remove {contextMenu.type}
          </div>
        </div>
      )}
    </div>
  );
};
