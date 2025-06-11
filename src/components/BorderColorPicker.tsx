import { useEffect, useRef, useState } from "react";
import { BorderStyle } from "../models/TableDataModel.js";
import { ColorPalette } from "./ColorPalette.js";

export interface BorderColorPickerProps {
  value: BorderStyle;
  onChange: (borderColor: BorderStyle) => void;
  label?: string;
}

export const BorderColorPicker = ({ value, onChange, label }: BorderColorPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);
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

  const handleSideColorChange = (side: keyof BorderStyle, color: string) => {
    onChange({
      ...value,
      [side]: color,
    });
  };

  const handleAllSidesChange = (color: string) => {
    onChange({
      top: color,
      right: color,
      bottom: color,
      left: color,
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
    borderTopColor: value.top === "transparent" ? "transparent" : value.top,
    borderRightColor: value.right === "transparent" ? "transparent" : value.right,
    borderBottomColor: value.bottom === "transparent" ? "transparent" : value.bottom,
    borderLeftColor: value.left === "transparent" ? "transparent" : value.left,
    borderRadius: "2px",
    // Add a subtle background pattern to show transparent borders
    backgroundImage:
      value.top === "transparent" || value.right === "transparent" || value.bottom === "transparent" || value.left === "transparent"
        ? "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px"
        : "none",
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
    minWidth: "320px",
  };

  const sideButtonStyle = (side: keyof BorderStyle) => ({
    padding: "8px 12px",
    margin: "2px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: selectedSide === side ? "#007bff" : "#fff",
    color: selectedSide === side ? "#fff" : "#333",
    cursor: "pointer",
    fontSize: "12px",
  });

  const sideGridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: "4px",
    width: "120px",
    height: "120px",
    margin: "0 auto 16px",
  };

  const allSidesEqual = value.top === value.right && value.right === value.bottom && value.bottom === value.left;

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
        <span>Border Colors</span>
        <span>▼</span>
      </button>

      {showPicker && (
        <div style={dropdownStyle}>
          <div style={{ marginBottom: "16px", textAlign: "center" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px" }}>Select Border Side</h4>

            {/* Visual border selector */}
            <div style={sideGridStyle}>
              <button
                type="button"
                style={{
                  ...sideButtonStyle("top"),
                  gridColumn: "1 / 3",
                  gridRow: "1",
                }}
                onClick={() => {
                  setSelectedSide("top");
                }}
              >
                Top
              </button>
              <button
                type="button"
                style={{
                  ...sideButtonStyle("left"),
                  gridColumn: "1",
                  gridRow: "2",
                }}
                onClick={() => {
                  setSelectedSide("left");
                }}
              >
                Left
              </button>
              <button
                type="button"
                style={{
                  ...sideButtonStyle("right"),
                  gridColumn: "2",
                  gridRow: "2",
                }}
                onClick={() => {
                  setSelectedSide("right");
                }}
              >
                Right
              </button>
              <button
                type="button"
                style={{
                  ...sideButtonStyle("bottom"),
                  gridColumn: "1 / 3",
                  gridRow: "3",
                }}
                onClick={() => {
                  setSelectedSide("bottom");
                }}
              >
                Bottom
              </button>
            </div>
          </div>

          {/* Current side color info */}
          <div style={{ marginBottom: "16px", textAlign: "center", fontSize: "12px", color: "#666" }}>
            Editing: <strong>{selectedSide}</strong> border ({value[selectedSide]})
          </div>

          {/* Color picker for selected side */}
          <div style={{ marginBottom: "16px" }}>
            <ColorPalette
              value={value[selectedSide]}
              onChange={(color) => {
                handleSideColorChange(selectedSide, color);
              }}
              label={`${selectedSide.charAt(0).toUpperCase() + selectedSide.slice(1)} Border`}
              allowTransparent={true}
            />
          </div>

          {/* Apply to all sides option */}
          <div
            style={{
              borderTop: "1px solid #eee",
              paddingTop: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
            }}
          >
            <button
              type="button"
              style={{
                padding: "6px 12px",
                border: "1px solid #007bff",
                borderRadius: "4px",
                backgroundColor: allSidesEqual ? "#007bff" : "#fff",
                color: allSidesEqual ? "#fff" : "#007bff",
                cursor: "pointer",
                fontSize: "12px",
              }}
              onClick={() => {
                handleAllSidesChange(value[selectedSide]);
              }}
            >
              Apply {value[selectedSide]} to All Sides
            </button>

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
