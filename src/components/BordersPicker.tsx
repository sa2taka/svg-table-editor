import { useEffect, useRef, useState } from "react";
import { BorderStyle, DEFAULT_BORDER_COLOR, GridBorderStyle, TRANSPARENT_COLOR } from "../models/TableDataModel.js";
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

export const BordersPicker = ({ cellBorder, onCellBorderChange, gridBorder, onGridBorderChange, label }: BordersPickerProps) => {
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

  // プリセット境界線パターン - より明確なUX
  const applyPreset = (preset: "none" | "all" | "outline" | "inside") => {
    const currentColor = getCurrentColor();
    const borderColor = currentColor === "transparent" ? DEFAULT_BORDER_COLOR : currentColor;

    // eslint-disable-next-line no-console
    console.log("🔍 BordersPicker applyPreset:", {
      preset,
      currentColor,
      borderColor,
      cellBorder,
      gridBorder,
    });

    switch (preset) {
      case "none": {
        // 選択セルの全境界線を透明に
        const noneStyle = {
          top: TRANSPARENT_COLOR,
          right: TRANSPARENT_COLOR,
          bottom: TRANSPARENT_COLOR,
          left: TRANSPARENT_COLOR,
        };
        // eslint-disable-next-line no-console
        console.log("🔍 Applying 'none' preset:", noneStyle);
        onCellBorderChange(noneStyle);
        break;
      }
      case "all": {
        // 選択セルの全境界線を現在の色に
        const allStyle = {
          top: borderColor,
          right: borderColor,
          bottom: borderColor,
          left: borderColor,
        };
        // eslint-disable-next-line no-console
        console.log("🔍 Applying 'all' preset:", allStyle);
        onCellBorderChange(allStyle);
        break;
      }
      case "outline": {
        // 選択範囲の外枠のみ
        const outlineStyle = {
          ...gridBorder,
          outer: {
            top: borderColor,
            right: borderColor,
            bottom: borderColor,
            left: borderColor,
          },
        };
        // eslint-disable-next-line no-console
        console.log("🔍 Applying 'outline' preset:", outlineStyle);
        onGridBorderChange(outlineStyle);
        break;
      }
      case "inside": {
        // 選択範囲の内側グリッドのみ
        const insideStyle = {
          outer: gridBorder.outer,
          innerVertical: borderColor,
          innerHorizontal: borderColor,
        };
        // eslint-disable-next-line no-console
        console.log("🔍 Applying 'inside' preset:", insideStyle);
        onGridBorderChange(insideStyle);
        break;
      }
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
    let color: string;
    if (mode === "cell") {
      color = cellBorder[selectedSide];
    } else {
      switch (target) {
        case "outer":
          color = gridBorder.outer[selectedSide];
          break;
        case "innerVertical":
          color = gridBorder.innerVertical;
          break;
        case "innerHorizontal":
          color = gridBorder.innerHorizontal;
          break;
        default:
          color = DEFAULT_BORDER_COLOR;
      }
    }
    // Convert internal transparent to UI transparent
    return color === TRANSPARENT_COLOR ? "transparent" : color;
  };

  const handleColorChange = (color: string) => {
    // Convert UI transparent to internal transparent
    const internalColor = color === "transparent" ? TRANSPARENT_COLOR : color;

    if (mode === "cell") {
      handleCellBorderSide(selectedSide, internalColor);
    } else {
      switch (target) {
        case "outer":
          handleGridBorderChange("outer", {
            ...gridBorder.outer,
            [selectedSide]: internalColor,
          });
          break;
        case "innerVertical":
          handleGridBorderChange("innerVertical", internalColor);
          break;
        case "innerHorizontal":
          handleGridBorderChange("innerHorizontal", internalColor);
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
    borderTopColor: cellBorder.top === TRANSPARENT_COLOR ? "#ddd" : cellBorder.top,
    borderRightColor: cellBorder.right === TRANSPARENT_COLOR ? "#ddd" : cellBorder.right,
    borderBottomColor: cellBorder.bottom === TRANSPARENT_COLOR ? "#ddd" : cellBorder.bottom,
    borderLeftColor: cellBorder.left === TRANSPARENT_COLOR ? "#ddd" : cellBorder.left,
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

          {/* カラー選択エリア */}
          <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
            <div style={{ fontSize: "12px", marginBottom: "8px", color: "#666", fontWeight: "bold" }}>1. 境界線の色を選択:</div>
            <ColorPalette value={getCurrentColor()} onChange={handleColorChange} label="Border Color" allowTransparent={true} />
          </div>

          {/* プリセットボタン */}
          <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#f0f8ff", borderRadius: "6px" }}>
            <div style={{ fontSize: "12px", marginBottom: "8px", color: "#666", fontWeight: "bold" }}>2. 適用パターンを選択:</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                style={presetButtonStyle}
                onClick={() => {
                  applyPreset("none");
                }}
                title="すべての境界線を削除"
              >
                🚫 境界線なし
              </button>
              <button
                type="button"
                style={presetButtonStyle}
                onClick={() => {
                  applyPreset("all");
                }}
                title="選択セルのすべての境界線"
              >
                ⬜ すべての境界線
              </button>
              <button
                type="button"
                style={presetButtonStyle}
                onClick={() => {
                  applyPreset("outline");
                }}
                title="選択範囲の外枠のみ"
              >
                🔲 外枠のみ
              </button>
              <button
                type="button"
                style={presetButtonStyle}
                onClick={() => {
                  applyPreset("inside");
                }}
                title="選択範囲内のグリッド線"
              >
                ⊞ 内側グリッド
              </button>
            </div>
          </div>

          {mode === "cell" ? (
            // 個別セル境界線設定
            <div>
              <div style={{ marginBottom: "12px", fontSize: "12px", color: "#666" }}>Edit individual cell borders:</div>

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
              <div style={{ marginBottom: "12px", fontSize: "12px", color: "#666" }}>Edit selection range borders:</div>

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
