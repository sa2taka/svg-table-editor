import { useEffect, useRef, useState } from "react";
import { BorderStyle, GridBorderStyle } from "../models/TableDataModel.js";
import { ColorPalette } from "./ColorPalette.js";

export interface BordersPickerProps {
  // セルの外枠境界線
  cellBorder: BorderStyle;
  onCellBorderChange: (borderColor: BorderStyle) => void;
  // グリッド境界線（選択範囲全体）
  gridBorder: GridBorderStyle;
  onGridBorderChange: (borderStyle: GridBorderStyle) => void;
  label?: string;
}

type BorderMode = "cell" | "grid";
type BorderTarget = "outer" | "innerVertical" | "innerHorizontal" | "individual";

export const BordersPicker = ({ 
  cellBorder, 
  onCellBorderChange, 
  gridBorder, 
  onGridBorderChange, 
  label 
}: BordersPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<BorderMode>("cell");
  const [target, setTarget] = useState<BorderTarget>("outer");
  const [selectedSide, setSelectedSide] = useState<keyof BorderStyle>("top");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showPicker]);

  // プリセット境界線パターン
  const applyPreset = (preset: "none" | "all" | "outer" | "grid") => {
    switch (preset) {
      case "none":
        onCellBorderChange({
          top: "transparent",
          right: "transparent", 
          bottom: "transparent",
          left: "transparent",
        });
        break;
      case "all":
        onCellBorderChange({
          top: "#000000",
          right: "#000000",
          bottom: "#000000", 
          left: "#000000",
        });
        break;
      case "outer":
        onGridBorderChange({
          ...gridBorder,
          outer: {
            top: "#000000",
            right: "#000000",
            bottom: "#000000",
            left: "#000000",
          },
        });
        break;
      case "grid":
        onGridBorderChange({
          outer: gridBorder.outer,
          innerVertical: "#000000",
          innerHorizontal: "#000000",
        });
        break;
    }
  };

  // セル境界線の個別操作
  const handleCellBorderSide = (side: keyof BorderStyle, color: string) => {
    onCellBorderChange({
      ...cellBorder,
      [side]: color,
    });
  };

  // グリッド境界線の操作
  const handleGridBorderChange = (borderType: "outer" | "innerVertical" | "innerHorizontal", value: BorderStyle | string) => {
    if (borderType === "outer") {
      onGridBorderChange({
        ...gridBorder,
        outer: value as BorderStyle,
      });
    } else {
      onGridBorderChange({
        ...gridBorder,
        [borderType]: value as string,
      });
    }
  };

  const getCurrentColor = (): string => {
    if (mode === "cell") {
      return cellBorder[selectedSide];
    } else {
      switch (target) {
        case "outer":
          return gridBorder.outer[selectedSide];
        case "innerVertical":
          return gridBorder.innerVertical;
        case "innerHorizontal":
          return gridBorder.innerHorizontal;
        default:
          return "#000000";
      }
    }
  };

  const handleColorChange = (color: string) => {
    if (mode === "cell") {
      handleCellBorderSide(selectedSide, color);
    } else {
      switch (target) {
        case "outer":
          handleGridBorderChange("outer", {
            ...gridBorder.outer,
            [selectedSide]: color,
          });
          break;
        case "innerVertical":
          handleGridBorderChange("innerVertical", color);
          break;
        case "innerHorizontal":
          handleGridBorderChange("innerHorizontal", color);
          break;
      }
    }
  };

  const containerStyle = {
    position: "relative" as const,
    display: "inline-block",
  };

  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "14px",
  };

  const borderPreviewStyle = {
    width: "24px",
    height: "24px",
    position: "relative" as const,
    backgroundColor: "#fff",
    border: "3px solid",
    borderTopColor: cellBorder.top === "transparent" ? "#ddd" : cellBorder.top,
    borderRightColor: cellBorder.right === "transparent" ? "#ddd" : cellBorder.right,
    borderBottomColor: cellBorder.bottom === "transparent" ? "#ddd" : cellBorder.bottom,
    borderLeftColor: cellBorder.left === "transparent" ? "#ddd" : cellBorder.left,
    borderRadius: "2px",
  };

  const dropdownStyle = {
    position: "absolute" as const,
    top: "100%",
    left: "0",
    zIndex: 1000,
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "16px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    minWidth: "360px",
  };

  const tabStyle = (active: boolean) => ({
    padding: "8px 16px",
    border: "1px solid #ccc",
    borderRadius: "4px 4px 0 0",
    backgroundColor: active ? "#007bff" : "#f5f5f5",
    color: active ? "#fff" : "#333",
    cursor: "pointer",
    fontSize: "12px",
  });

  const presetButtonStyle = {
    padding: "6px 12px",
    margin: "2px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "12px",
  };

  return (
    <div ref={pickerRef} style={containerStyle}>
      {label && <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>{label}:</label>}

      <button
        type="button"
        style={buttonStyle}
        onClick={() => {
          setShowPicker(!showPicker);
        }}
      >
        <div style={borderPreviewStyle} />
        <span>Borders</span>
        <span>▼</span>
      </button>

      {showPicker && (
        <div style={dropdownStyle}>
          {/* タブ切り替え */}
          <div style={{ display: "flex", marginBottom: "16px" }}>
            <button
              type="button"
              style={tabStyle(mode === "cell")}
              onClick={() => {
                setMode("cell");
              }}
            >
              Individual Cell
            </button>
            <button
              type="button"
              style={tabStyle(mode === "grid")}
              onClick={() => {
                setMode("grid");
              }}
            >
              Selection Range
            </button>
          </div>

          {/* プリセットボタン */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", marginBottom: "8px", color: "#666" }}>Quick Presets:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              <button
                type="button"
                style={presetButtonStyle}
                onClick={() => {
                  applyPreset("none");
                }}
              >
                🚫 No Borders
              </button>
              <button
                type="button"
                style={presetButtonStyle}
                onClick={() => {
                  applyPreset("all");
                }}
              >
                ⬜ All Borders
              </button>
              <button
                type="button"
                style={presetButtonStyle}
                onClick={() => {
                  applyPreset("outer");
                }}
              >
                🔲 Outer Only
              </button>
              <button
                type="button"
                style={presetButtonStyle}
                onClick={() => {
                  applyPreset("grid");
                }}
              >
                ⊞ Grid Lines
              </button>
            </div>
          </div>

          {mode === "cell" ? (
            // 個別セル境界線設定
            <div>
              <div style={{ marginBottom: "12px", fontSize: "12px", color: "#666" }}>
                Edit individual cell borders:
              </div>

              {/* 境界線側選択 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", marginBottom: "12px" }}>
                {(["top", "right", "bottom", "left"] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    style={{
                      ...presetButtonStyle,
                      backgroundColor: selectedSide === side ? "#007bff" : "#fff",
                      color: selectedSide === side ? "#fff" : "#333",
                    }}
                    onClick={() => {
                      setSelectedSide(side);
                    }}
                  >
                    {side.charAt(0).toUpperCase() + side.slice(1)}
                  </button>
                ))}
              </div>

              <ColorPalette
                value={getCurrentColor()}
                onChange={handleColorChange}
                label={`${selectedSide} Border`}
                allowTransparent={true}
              />
            </div>
          ) : (
            // グリッド境界線設定
            <div>
              <div style={{ marginBottom: "12px", fontSize: "12px", color: "#666" }}>
                Edit selection range borders:
              </div>

              {/* グリッド境界線タイプ選択 */}
              <div style={{ marginBottom: "12px" }}>
                {[
                  { key: "outer", label: "Outer Border" },
                  { key: "innerVertical", label: "Vertical Lines" },
                  { key: "innerHorizontal", label: "Horizontal Lines" },
                ].map(({ key, label: typeLabel }) => (
                  <button
                    key={key}
                    type="button"
                    style={{
                      ...presetButtonStyle,
                      backgroundColor: target === key ? "#007bff" : "#fff",
                      color: target === key ? "#fff" : "#333",
                      marginRight: "4px",
                    }}
                    onClick={() => {
                      setTarget(key as BorderTarget);
                    }}
                  >
                    {typeLabel}
                  </button>
                ))}
              </div>

              {target === "outer" && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", marginBottom: "8px" }}>
                    {(["top", "right", "bottom", "left"] as const).map((side) => (
                      <button
                        key={side}
                        type="button"
                        style={{
                          ...presetButtonStyle,
                          backgroundColor: selectedSide === side ? "#007bff" : "#fff",
                          color: selectedSide === side ? "#fff" : "#333",
                        }}
                        onClick={() => {
                          setSelectedSide(side);
                        }}
                      >
                        {side.charAt(0).toUpperCase() + side.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <ColorPalette
                value={getCurrentColor()}
                onChange={handleColorChange}
                label={
                  target === "outer" 
                    ? `Outer ${selectedSide} Border`
                    : target === "innerVertical"
                    ? "Vertical Grid Lines"
                    : "Horizontal Grid Lines"
                }
                allowTransparent={true}
              />
            </div>
          )}

          {/* 閉じるボタン */}
          <div style={{ marginTop: "16px", textAlign: "right" }}>
            <button
              type="button"
              style={{
                padding: "6px 12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "#f5f5f5",
                cursor: "pointer",
                fontSize: "12px",
              }}
              onClick={() => {
                setShowPicker(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};