import { KeyboardShortcut, formatShortcutKey } from "../utils/keyboardShortcuts.js";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export const KeyboardShortcutsHelp = ({ isOpen, onClose, shortcuts }: KeyboardShortcutsHelpProps) => {
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
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "80vh",
    padding: "24px",
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
    padding: "8px 12px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "14px",
  };

  const shortcutListStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "16px",
  };

  const shortcutItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    backgroundColor: "#f8f9fa",
    borderRadius: "6px",
    border: "1px solid #e9ecef",
  };

  const shortcutKeyStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #dee2e6",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: "12px",
    fontFamily: "monospace",
    fontWeight: "bold",
    color: "#495057",
    minWidth: "60px",
    textAlign: "center" as const,
  };

  const descriptionStyle = {
    fontSize: "14px",
    color: "#495057",
    flex: 1,
    marginRight: "12px",
  };

  // ショートカットをカテゴリごとに分類
  const categorizedShortcuts = {
    セル操作: shortcuts.filter((s) => ["m", "s"].includes(s.key.toLowerCase()) && !s.ctrlKey),
    テーブル操作: shortcuts.filter((s) => s.ctrlKey && ["r", "d"].includes(s.key.toLowerCase())),
    ファイル操作: shortcuts.filter((s) => s.ctrlKey && ["e", "p", "n"].includes(s.key.toLowerCase())),
    その他: shortcuts.filter((s) => ["h", "esc"].includes(s.key.toLowerCase())),
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
      <div style={modalContentStyle} role="dialog" aria-modal="true" aria-labelledby="shortcuts-help-title">
        <div style={headerStyle}>
          <h2 id="shortcuts-help-title" style={{ margin: 0, color: "#333" }}>
            キーボードショートカット
          </h2>
          <button onClick={onClose} style={buttonStyle} aria-label="ヘルプを閉じる">
            ✕
          </button>
        </div>

        <div>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
            以下のキーボードショートカットを使用して、効率的にテーブルを編集できます。
            セルが編集中の場合は、ショートカットは無効になります。
          </p>

          {Object.entries(categorizedShortcuts).map(
            ([category, categoryShortcuts]) =>
              categoryShortcuts.length > 0 && (
                <div key={category} style={{ marginBottom: "24px" }}>
                  <h3
                    style={{
                      fontSize: "16px",
                      color: "#333",
                      marginBottom: "12px",
                      borderBottom: "1px solid #e9ecef",
                      paddingBottom: "4px",
                    }}
                  >
                    {category}
                  </h3>
                  <div style={shortcutListStyle}>
                    {categoryShortcuts.map((shortcut, index) => (
                      <div key={index} style={shortcutItemStyle}>
                        <div style={descriptionStyle}>{shortcut.description}</div>
                        <div style={shortcutKeyStyle}>{formatShortcutKey(shortcut)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
          )}

          <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#e3f2fd", borderRadius: "6px", border: "1px solid #bbdefb" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#1976d2", fontSize: "14px" }}>💡 ヒント</h4>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#1565c0" }}>
              <li>セルを選択してから M キーでセルを結合できます</li>
              <li>結合されたセルを選択して S キーで分割できます</li>
              <li>Shift + M でスマート結合が使用できます</li>
              <li>H キーでいつでもこのヘルプを表示できます</li>
            </ul>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
          <button onClick={onClose} style={{ ...buttonStyle, backgroundColor: "#007bff", color: "#fff", border: "1px solid #0056b3" }}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
