import { useEffect, useRef, useState } from "react";
import { BorderStyle, GridBorderStyle } from "../models/TableDataModel.js";
import { ColorPalette } from "./ColorPalette.js";

export interface ExcelBorderPickerProps {
  value: GridBorderStyle;
  onChange: (borderStyle: GridBorderStyle) => void;
  label?: string;
}

export const ExcelBorderPicker = ({ value, onChange, label }: ExcelBorderPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedOption, setSelectedOption] = useState<"outer" | "innerVertical" | "innerHorizontal">("outer");
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

  const handleOuterBorderChange = (side: keyof BorderStyle, color: string) => {
    onChange({
      ...value,
      outer: {
        ...value.outer,
        [side]: color,
      },
    });
  };

  const handleInnerGridChange = (type: "innerVertical" | "innerHorizontal", color: string) => {
    onChange({
      ...value,
      [type]: color,
    });
  };

  const handleAllOuterChange = (color: string) => {
    onChange({
      ...value,
      outer: {
        top: color,
        right: color,
        bottom: color,
        left: color,
      },
    });
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
    borderTopColor: value.outer.top === "transparent" ? "transparent" : value.outer.top,
    borderRightColor: value.outer.right === "transparent" ? "transparent" : value.outer.right,
    borderBottomColor: value.outer.bottom === "transparent" ? "transparent" : value.outer.bottom,
    borderLeftColor: value.outer.left === "transparent" ? "transparent" : value.outer.left,
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

  const optionButtonStyle = (option: string) => ({
    padding: "8px 16px",
    margin: "4px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: selectedOption === option ? "#007bff" : "#fff",
    color: selectedOption === option ? "#fff" : "#333",
    cursor: "pointer",
    fontSize: "14px",
    display: "block",
    width: "100%",
    textAlign: "left" as const,
  });

  // Visual grid for outer border sides
  const outerGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "auto auto auto",
    gap: "4px",
    width: "200px",
    margin: "12px auto",
  };

  const sideButtonStyle = (_side: keyof BorderStyle, isSelected: boolean) => ({
    padding: "6px 8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: isSelected ? "#007bff" : "#fff",
    color: isSelected ? "#fff" : "#333",
    cursor: "pointer",
    fontSize: "11px",
  });

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
        <span>Excel Borders</span>
        <span>▼</span>
      </button>

      {showPicker && (
        <div style={dropdownStyle}>
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px" }}>Border Type</h4>

            {/* Border type selection */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
              <button
                type="button"
                style={optionButtonStyle("outer")}
                onClick={() => {
                  setSelectedOption("outer");
                }}
              >
                📋 Outer Borders (周りの枠線)
              </button>
              <button
                type="button"
                style={optionButtonStyle("innerVertical")}
                onClick={() => {
                  setSelectedOption("innerVertical");
                }}
              >
                | Inner Vertical Lines (中の縦線)
              </button>
              <button
                type="button"
                style={optionButtonStyle("innerHorizontal")}
                onClick={() => {
                  setSelectedOption("innerHorizontal");
                }}
              >
                ≡ Inner Horizontal Lines (中の横線)
              </button>
            </div>
          </div>

          {/* Outer border controls */}
          {selectedOption === "outer" && (
            <div style={{ marginBottom: "16px" }}>
              <h5 style={{ margin: "0 0 8px 0", fontSize: "13px" }}>Outer Border Sides</h5>

              {/* Visual grid for outer border selection */}
              <div style={outerGridStyle}>
                <button
                  type="button"
                  style={{
                    ...sideButtonStyle("top", selectedSide === "top"),
                    gridColumn: "1 / 3",
                  }}
                  onClick={() => {
                    setSelectedSide("top");
                  }}
                >
                  Top: {value.outer.top}
                </button>
                <button
                  type="button"
                  style={sideButtonStyle("left", selectedSide === "left")}
                  onClick={() => {
                    setSelectedSide("left");
                  }}
                >
                  Left: {value.outer.left}
                </button>
                <button
                  type="button"
                  style={sideButtonStyle("right", selectedSide === "right")}
                  onClick={() => {
                    setSelectedSide("right");
                  }}
                >
                  Right: {value.outer.right}
                </button>
                <button
                  type="button"
                  style={{
                    ...sideButtonStyle("bottom", selectedSide === "bottom"),
                    gridColumn: "1 / 3",
                  }}
                  onClick={() => {
                    setSelectedSide("bottom");
                  }}
                >
                  Bottom: {value.outer.bottom}
                </button>
              </div>

              {/* Individual side color picker */}
              <div style={{ marginTop: "12px" }}>
                <ColorPalette
                  value={value.outer[selectedSide]}
                  onChange={(color) => {
                    handleOuterBorderChange(selectedSide, color);
                  }}
                  label={`${selectedSide.charAt(0).toUpperCase() + selectedSide.slice(1)} Border`}
                  allowTransparent={true}
                />
              </div>

              <div style={{ marginTop: "12px" }}>
                <ColorPalette
                  value={
                    value.outer.top === value.outer.right &&
                    value.outer.right === value.outer.bottom &&
                    value.outer.bottom === value.outer.left
                      ? value.outer.top
                      : "#000000"
                  }
                  onChange={(color) => {
                    handleAllOuterChange(color);
                  }}
                  label="Apply to All Outer Borders"
                  allowTransparent={true}
                />
              </div>
            </div>
          )}

          {/* Inner vertical lines */}
          {selectedOption === "innerVertical" && (
            <div style={{ marginBottom: "16px" }}>
              <ColorPalette
                value={value.innerVertical}
                onChange={(color) => {
                  handleInnerGridChange("innerVertical", color);
                }}
                label="Inner Vertical Lines Color"
                allowTransparent={true}
              />
            </div>
          )}

          {/* Inner horizontal lines */}
          {selectedOption === "innerHorizontal" && (
            <div style={{ marginBottom: "16px" }}>
              <ColorPalette
                value={value.innerHorizontal}
                onChange={(color) => {
                  handleInnerGridChange("innerHorizontal", color);
                }}
                label="Inner Horizontal Lines Color"
                allowTransparent={true}
              />
            </div>
          )}

          {/* Close button */}
          <div style={{ borderTop: "1px solid #eee", paddingTop: "12px", textAlign: "center" }}>
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
