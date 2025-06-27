import { useState } from "react";
import { TableDataModel } from "../models/TableDataModel.js";
import { generateSampleTSV, parseTSVToTable, validateTSV } from "../utils/tsvImporter.js";

interface TSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (table: TableDataModel) => void;
}

export const TSVImportModal = ({ isOpen, onClose, onImport }: TSVImportModalProps) => {
  const [tsvText, setTsvText] = useState("");
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    rowCount: number;
    columnCount: number;
  } | null>(null);

  const handleTSVChange = (text: string) => {
    setTsvText(text);
    if (text.trim()) {
      const result = validateTSV(text);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  };

  const handleImport = () => {
    if (tsvText.trim()) {
      try {
        const table = parseTSVToTable(tsvText);
        onImport(table);
        setTsvText("");
        setValidationResult(null);
        onClose();
      } catch (error) {
        alert(`TSVのインポートに失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
      }
    }
  };

  const handleLoadSample = () => {
    const sample = generateSampleTSV();
    setTsvText(sample);
    handleTSVChange(sample);
  };

  const handleClear = () => {
    setTsvText("");
    setValidationResult(null);
  };

  if (!isOpen) return null;

  const modalOverlayStyle = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalContentStyle = {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    width: "90%",
    maxWidth: "800px",
    maxHeight: "90%",
    overflow: "auto",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "1px solid #e0e0e0",
    paddingBottom: "16px",
  };

  const buttonStyle = {
    padding: "8px 16px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "14px",
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#007bff",
    color: "#fff",
    border: "1px solid #0056b3",
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#6c757d",
    color: "#fff",
    border: "1px solid #545b62",
  };

  const textareaStyle = {
    width: "100%",
    height: "300px",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
    fontFamily: "monospace",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
  };

  const statusStyle = {
    padding: "12px",
    marginTop: "12px",
    borderRadius: "4px",
    fontSize: "14px",
  };

  const successStatusStyle = {
    ...statusStyle,
    backgroundColor: "#d4edda",
    border: "1px solid #c3e6cb",
    color: "#155724",
  };

  const warningStatusStyle = {
    ...statusStyle,
    backgroundColor: "#fff3cd",
    border: "1px solid #ffeaa7",
    color: "#856404",
  };

  const errorStatusStyle = {
    ...statusStyle,
    backgroundColor: "#f8d7da",
    border: "1px solid #f1c2c2",
    color: "#721c24",
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={modalOverlayStyle}
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="presentation"
    >
      <div style={modalContentStyle} role="dialog" aria-modal="true" aria-labelledby="tsv-import-title">
        <div style={headerStyle}>
          <h2 id="tsv-import-title" style={{ margin: 0, color: "#333" }}>
            TSVインポート
          </h2>
          <button onClick={onClose} style={buttonStyle}>
            ✕
          </button>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <p style={{ margin: "0 0 8px 0", color: "#666" }}>TSV（タブ区切り値）形式のテキストを入力してテーブルを生成します。</p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <button onClick={handleLoadSample} style={secondaryButtonStyle}>
              サンプルデータを読み込み
            </button>
            <button onClick={handleClear} style={buttonStyle}>
              クリア
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }} htmlFor="tsv-textarea">
            TSVテキスト:
          </label>
          <textarea
            id="tsv-textarea"
            value={tsvText}
            onChange={(e) => {
              handleTSVChange(e.target.value);
            }}
            placeholder="列1&#9;列2&#9;列3&#10;データ1&#9;データ2&#9;データ3&#10;データ4&#9;データ5&#9;データ6"
            style={textareaStyle}
          />
        </div>

        {validationResult && (
          <div>
            {validationResult.isValid ? (
              <div style={successStatusStyle}>
                <strong>✓ 有効なTSVです</strong>
                <br />
                {validationResult.rowCount}行 × {validationResult.columnCount}列のテーブルが作成されます。
              </div>
            ) : (
              <div style={errorStatusStyle}>
                <strong>✗ TSVに問題があります</strong>
                <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div style={warningStatusStyle}>
                <strong>⚠ 警告</strong>
                <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
          <button onClick={onClose} style={buttonStyle}>
            キャンセル
          </button>
          <button
            onClick={handleImport}
            style={
              validationResult?.isValid && tsvText.trim()
                ? primaryButtonStyle
                : { ...primaryButtonStyle, opacity: 0.5, cursor: "not-allowed" }
            }
            disabled={!validationResult?.isValid || !tsvText.trim()}
          >
            インポート
          </button>
        </div>
      </div>
    </div>
  );
};
