import { useEffect, useRef, useState } from "react";

export interface ColorPaletteProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  allowTransparent?: boolean;
}

const PRESET_COLORS = [
  // First row - Whites and Grays
  ["#ffffff", "#f2f2f2", "#d9d9d9", "#bfbfbf", "#a6a6a6", "#808080", "#595959", "#404040", "#262626", "#0d0d0d"],

  // Second row - Reds
  ["#ffebee", "#ffcdd2", "#ef9a9a", "#e57373", "#ef5350", "#f44336", "#e53935", "#d32f2f", "#c62828", "#b71c1c"],

  // Third row - Blues
  ["#e3f2fd", "#bbdefb", "#90caf9", "#64b5f6", "#42a5f5", "#2196f3", "#1e88e5", "#1976d2", "#1565c0", "#0d47a1"],

  // Fourth row - Greens
  ["#e8f5e8", "#c8e6c9", "#a5d6a7", "#81c784", "#66bb6a", "#4caf50", "#43a047", "#388e3c", "#2e7d32", "#1b5e20"],

  // Fifth row - Yellows/Oranges
  ["#fff3e0", "#ffe0b2", "#ffcc80", "#ffb74d", "#ffa726", "#ff9800", "#fb8c00", "#f57c00", "#ef6c00", "#e65100"],

  // Sixth row - Purples
  ["#f3e5f5", "#e1bee7", "#ce93d8", "#ba68c8", "#ab47bc", "#9c27b0", "#8e24aa", "#7b1fa2", "#6a1b9a", "#4a148c"],
];

export const ColorPalette = ({ value, onChange, label, allowTransparent = false }: ColorPaletteProps) => {
  const [showPalette, setShowPalette] = useState(false);
  const [customColor, setCustomColor] = useState(value.startsWith("#") ? value : "#000000");
  const paletteRef = useRef<HTMLDivElement>(null);

  // Close palette when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        setShowPalette(false);
      }
    };

    if (showPalette) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showPalette]);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setShowPalette(false);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    onChange(color);
  };

  const currentDisplayColor = value === "transparent" ? "#ffffff" : value;
  const isTransparent = value === "transparent";

  const paletteStyle = {
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

  const colorDisplayStyle = {
    width: "20px",
    height: "20px",
    border: "1px solid #ccc",
    borderRadius: "3px",
    backgroundColor: currentDisplayColor,
    position: "relative" as const,
  };

  const transparentOverlayStyle = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: "#666",
    fontSize: "10px",
    fontWeight: "bold" as const,
    textShadow: "1px 1px 1px white",
  };

  const dropdownStyle = {
    position: "absolute" as const,
    top: "100%",
    left: "0",
    zIndex: 1000,
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "12px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    minWidth: "280px",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(10, 1fr)",
    gap: "4px",
    marginBottom: "12px",
  };

  const colorCellStyle = {
    width: "20px",
    height: "20px",
    border: "1px solid #ddd",
    borderRadius: "2px",
    cursor: "pointer",
  };

  const customSectionStyle = {
    borderTop: "1px solid #eee",
    paddingTop: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  return (
    <div ref={paletteRef} style={paletteStyle}>
      {label && <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>{label}:</label>}

      <button
        type="button"
        style={buttonStyle}
        onClick={() => {
          setShowPalette(!showPalette);
        }}
      >
        <div style={colorDisplayStyle}>{isTransparent && <span style={transparentOverlayStyle}>∅</span>}</div>
        <span>{isTransparent ? "Transparent" : value.toUpperCase()}</span>
        <span>▼</span>
      </button>

      {showPalette && (
        <div style={dropdownStyle}>
          {/* Transparent option */}
          {allowTransparent && (
            <div style={{ marginBottom: "12px" }}>
              <button
                type="button"
                style={{
                  ...colorCellStyle,
                  width: "auto",
                  padding: "4px 8px",
                  backgroundColor: value === "transparent" ? "#e3f2fd" : "#fff",
                }}
                onClick={() => {
                  handleColorSelect("transparent");
                }}
              >
                ∅ Transparent
              </button>
            </div>
          )}

          {/* Preset colors */}
          {PRESET_COLORS.map((row, rowIndex) => (
            <div key={rowIndex} style={gridStyle}>
              {row.map((color) => (
                <button
                  key={color}
                  type="button"
                  style={{
                    ...colorCellStyle,
                    backgroundColor: color,
                    border: value === color ? "2px solid #007bff" : "1px solid #ddd",
                  }}
                  onClick={() => {
                    handleColorSelect(color);
                  }}
                  title={color}
                />
              ))}
            </div>
          ))}

          {/* Custom color picker */}
          <div style={customSectionStyle}>
            <span style={{ fontSize: "14px" }}>Custom:</span>
            <input
              type="color"
              value={customColor}
              onChange={(e) => {
                handleCustomColorChange(e.target.value);
              }}
              style={{ width: "40px", height: "30px", border: "1px solid #ccc", borderRadius: "4px" }}
              aria-label="Custom color picker"
            />
            <button
              type="button"
              style={{
                padding: "4px 8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "#f5f5f5",
                cursor: "pointer",
                fontSize: "12px",
              }}
              onClick={() => {
                setShowPalette(false);
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
