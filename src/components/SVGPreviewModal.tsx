import { useEffect, useRef } from "react";

interface SVGPreviewModalProps {
  isOpen: boolean;
  svgContent: string;
  onClose: () => void;
  onDownload: () => void;
}

export const SVGPreviewModal = ({ isOpen, svgContent, onClose, onDownload }: SVGPreviewModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalStyle = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const contentStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "20px",
    maxWidth: "90%",
    maxHeight: "90%",
    display: "flex",
    flexDirection: "column" as const,
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    borderBottom: "1px solid #eee",
    paddingBottom: "12px",
  };

  const previewAreaStyle = {
    flex: 1,
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "16px",
    backgroundColor: "#f9f9f9",
    overflow: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "400px",
  };

  const buttonStyle = {
    padding: "8px 16px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    margin: "0 4px",
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#28a745",
    color: "white",
    border: "1px solid #1e7e34",
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#6c757d",
    color: "white",
    border: "1px solid #5a6268",
  };

  return (
    <div style={modalStyle}>
      <div ref={modalRef} style={contentStyle}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: "18px" }}>SVG Preview</h3>
          <div>
            <button style={primaryButtonStyle} onClick={onDownload} title="Download SVG file">
              📥 Download
            </button>
            <button style={secondaryButtonStyle} onClick={onClose} title="Close preview">
              ✕ Close
            </button>
          </div>
        </div>

        <div style={previewAreaStyle}>
          <div
            dangerouslySetInnerHTML={{ __html: svgContent }}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              overflow: "auto",
            }}
          />
        </div>

        <div
          style={{
            marginTop: "12px",
            fontSize: "12px",
            color: "#666",
            textAlign: "center" as const,
          }}
        >
          Press Escape or click outside to close
        </div>
      </div>
    </div>
  );
};
