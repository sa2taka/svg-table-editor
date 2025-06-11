import { BorderStyle, CellStyle, GridBorderStyle } from "../models/TableDataModel.js";
import { BordersPicker } from "./BordersPicker.js";
import { ColorPalette } from "./ColorPalette.js";

interface ToolbarProps {
  selectedCellStyle?: CellStyle;
  onStyleChange?: (style: Partial<CellStyle>) => void;
  onExcelBorderChange?: (gridBorder: GridBorderStyle) => void;
  onMergeCells?: () => void;
  onSplitCells?: () => void;
  onSmartMerge?: () => void;
  onAddRow?: () => void;
  onRemoveRow?: () => void;
  onAddColumn?: () => void;
  onRemoveColumn?: () => void;
  onExportSVG?: () => void;
  onPreviewSVG?: () => void;
  onNewTable?: () => void;
  onClearURL?: () => void;
  canMerge?: boolean;
  canSplit?: boolean;
  tableSize?: { rows: number; columns: number };
  currentGridStyle?: {
    innerVertical: string;
    innerHorizontal: string;
  };
}

export const Toolbar = ({
  selectedCellStyle,
  onStyleChange,
  onExcelBorderChange,
  onMergeCells,
  onSplitCells,
  onSmartMerge,
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn,
  onExportSVG,
  onPreviewSVG,
  onNewTable,
  onClearURL,
  canMerge = false,
  canSplit = false,
  tableSize,
  currentGridStyle,
}: ToolbarProps) => {
  const handleBoldToggle = () => {
    if (onStyleChange) {
      const newWeight = selectedCellStyle?.fontWeight === "bold" ? "normal" : "bold";
      onStyleChange({ fontWeight: newWeight });
    }
  };

  const handleColorChange = (color: string) => {
    if (onStyleChange) {
      onStyleChange({ color });
    }
  };

  const handleFontFamilyChange = (fontFamily: string) => {
    if (onStyleChange) {
      onStyleChange({ fontFamily });
    }
  };

  const handleTextAlignChange = (textAlign: "left" | "center" | "right") => {
    if (onStyleChange) {
      onStyleChange({ textAlign });
    }
  };

  const handleBackgroundColorChange = (backgroundColor: string) => {
    if (onStyleChange) {
      onStyleChange({ backgroundColor });
    }
  };

  const handleBorderColorChange = (borderColor: BorderStyle) => {
    if (onStyleChange) {
      onStyleChange({ borderColor });
    }
  };

  const toolbarStyle = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px",
    backgroundColor: "#f5f5f5",
    borderBottom: "1px solid #ddd",
    flexWrap: "wrap" as const,
  };

  const groupStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    backgroundColor: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    flexWrap: "wrap" as const,
  };

  const groupTitleStyle = {
    fontSize: "11px",
    color: "#666",
    fontWeight: "bold" as const,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginRight: "4px",
  };

  const buttonStyle = {
    padding: "8px 12px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    cursor: "pointer",
    borderRadius: "4px",
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#007bff",
    color: "#fff",
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#f5f5f5",
    color: "#999",
    cursor: "not-allowed",
    border: "1px solid #ddd",
  };

  const inputStyle = {
    padding: "6px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  };

  return (
    <div style={toolbarStyle}>
      {/* Format Group */}
      <div style={groupStyle}>
        <span style={groupTitleStyle}>Format</span>
        <button
          style={selectedCellStyle?.fontWeight === "bold" ? activeButtonStyle : buttonStyle}
          onClick={handleBoldToggle}
          className={selectedCellStyle?.fontWeight === "bold" ? "active" : ""}
          aria-label="Bold"
        >
          <strong>B</strong>
        </button>

        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          Font Family:
          <select
            value={selectedCellStyle?.fontFamily ?? "Arial"}
            onChange={(e) => {
              handleFontFamilyChange(e.target.value);
            }}
            style={inputStyle}
          >
            <option value="Arial">Arial</option>
            <option value="Times">Times</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
        </label>

        <div style={{ display: "flex", gap: "2px" }}>
          <button
            style={selectedCellStyle?.textAlign === "left" ? activeButtonStyle : buttonStyle}
            onClick={() => {
              handleTextAlignChange("left");
            }}
            aria-label="Align Left"
          >
            ◄
          </button>
          <button
            style={selectedCellStyle?.textAlign === "center" ? activeButtonStyle : buttonStyle}
            onClick={() => {
              handleTextAlignChange("center");
            }}
            aria-label="Align Center"
          >
            ◆
          </button>
          <button
            style={selectedCellStyle?.textAlign === "right" ? activeButtonStyle : buttonStyle}
            onClick={() => {
              handleTextAlignChange("right");
            }}
            aria-label="Align Right"
          >
            ►
          </button>
        </div>
      </div>

      {/* Colors Group */}
      <div style={groupStyle}>
        <span style={groupTitleStyle}>Colors</span>
        <ColorPalette value={selectedCellStyle?.color ?? "#000000"} onChange={handleColorChange} label="Text" />
        <ColorPalette
          value={selectedCellStyle?.backgroundColor ?? "transparent"}
          onChange={handleBackgroundColorChange}
          label="Background"
          allowTransparent={true}
        />
      </div>

      {/* Borders Group */}
      {onExcelBorderChange && (
        <div style={groupStyle}>
          <span style={groupTitleStyle}>Borders</span>
          <BordersPicker
            cellBorder={
              selectedCellStyle?.borderColor ?? {
                top: "#000000",
                right: "#000000",
                bottom: "#000000",
                left: "#000000",
              }
            }
            onCellBorderChange={handleBorderColorChange}
            gridBorder={{
              outer: selectedCellStyle?.borderColor ?? {
                top: "#000000",
                right: "#000000",
                bottom: "#000000",
                left: "#000000",
              },
              innerVertical: currentGridStyle?.innerVertical ?? "#000000",
              innerHorizontal: currentGridStyle?.innerHorizontal ?? "#000000",
            }}
            onGridBorderChange={onExcelBorderChange}
          />
        </div>
      )}

      {/* Cell Operations Group */}
      <div style={groupStyle}>
        <span style={groupTitleStyle}>Cells</span>
        <button
          style={canMerge ? buttonStyle : disabledButtonStyle}
          onClick={() => {
            if (canMerge && onMergeCells) {
              onMergeCells();
            }
          }}
          disabled={!canMerge}
          aria-label="Merge Cells"
          title={canMerge ? "Merge selected cells" : "Cannot merge: invalid range or contains merged cells"}
        >
          ⧉ Merge
        </button>
        <button
          style={buttonStyle}
          onClick={() => {
            if (onSmartMerge) {
              onSmartMerge();
            }
          }}
          aria-label="Smart Merge"
          title="Smart merge: automatically handle overlapping merged cells"
        >
          🔗 Smart
        </button>
        <button
          style={canSplit ? buttonStyle : disabledButtonStyle}
          onClick={() => {
            if (canSplit && onSplitCells) {
              onSplitCells();
            }
          }}
          disabled={!canSplit}
          aria-label="Split Cells"
          title={canSplit ? "Split merged cells" : "No merged cells to split"}
        >
          ⧈ Split
        </button>
      </div>

      {/* Table Size Group */}
      <div style={groupStyle}>
        <span style={groupTitleStyle}>Table ({tableSize?.rows ?? 0}×{tableSize?.columns ?? 0})</span>
        <div style={{ display: "flex", gap: "2px" }}>
          <button
            style={{
              ...buttonStyle,
              padding: "4px 6px",
              fontSize: "11px",
            }}
            onClick={() => {
              if (onAddRow) {
                onAddRow();
              }
            }}
            title="Add row"
          >
            +R
          </button>
          <button
            style={{
              ...buttonStyle,
              padding: "4px 6px",
              fontSize: "11px",
              ...(tableSize?.rows === 1 ? disabledButtonStyle : {}),
            }}
            onClick={() => {
              if (onRemoveRow && tableSize?.rows !== 1) {
                onRemoveRow();
              }
            }}
            disabled={tableSize?.rows === 1}
            title="Remove row"
          >
            -R
          </button>
          <button
            style={{
              ...buttonStyle,
              padding: "4px 6px",
              fontSize: "11px",
            }}
            onClick={() => {
              if (onAddColumn) {
                onAddColumn();
              }
            }}
            title="Add column"
          >
            +C
          </button>
          <button
            style={{
              ...buttonStyle,
              padding: "4px 6px",
              fontSize: "11px",
              ...(tableSize?.columns === 1 ? disabledButtonStyle : {}),
            }}
            onClick={() => {
              if (onRemoveColumn && tableSize?.columns !== 1) {
                onRemoveColumn();
              }
            }}
            disabled={tableSize?.columns === 1}
            title="Remove column"
          >
            -C
          </button>
        </div>
      </div>

      {/* Export Group */}
      <div style={groupStyle}>
        <span style={groupTitleStyle}>Export</span>
        
        <button
          style={{
            ...buttonStyle,
            backgroundColor: "#17a2b8",
            color: "#fff",
            fontWeight: "bold",
            padding: "6px 10px",
            fontSize: "12px",
            border: "1px solid #138496",
          }}
          onClick={() => {
            if (onPreviewSVG) {
              onPreviewSVG();
            }
          }}
          title="Preview responsive SVG (auto-sized cells)"
        >
          👁️ Preview
        </button>
        
        <button
          style={{
            ...buttonStyle,
            backgroundColor: "#28a745",
            color: "#fff",
            fontWeight: "bold",
            padding: "6px 10px",
            fontSize: "12px",
            border: "1px solid #1e7e34",
          }}
          onClick={() => {
            if (onExportSVG) {
              onExportSVG();
            }
          }}
          title="Export responsive SVG (auto-sized cells)"
        >
          📥 Export
        </button>
      </div>

      {/* Project Group */}
      <div style={groupStyle}>
        <span style={groupTitleStyle}>Project</span>
        <button
          style={{
            ...buttonStyle,
            backgroundColor: "#007bff",
            color: "#fff",
            padding: "4px 8px",
            fontSize: "11px",
            border: "1px solid #0056b3",
          }}
          onClick={() => {
            if (onNewTable) {
              onNewTable();
            }
          }}
          title="Create new table (clears current work)"
        >
          🆕 New
        </button>
        
        <button
          style={{
            ...buttonStyle,
            backgroundColor: "#ffc107",
            color: "#000",
            padding: "4px 8px",
            fontSize: "11px",
            border: "1px solid #e0a800",
          }}
          onClick={() => {
            if (onClearURL) {
              onClearURL();
            }
          }}
          title="Clear URL state (keeps current table)"
        >
          🧹 Clear
        </button>
      </div>
    </div>
  );
};
