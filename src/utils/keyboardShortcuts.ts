/**
 * キーボードショートカット管理ユーティリティ
 */

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  condition?: () => boolean; // ショートカットが有効な条件
}

export interface KeyboardShortcutManager {
  shortcuts: Map<string, KeyboardShortcut>;
  addShortcut: (shortcut: KeyboardShortcut) => void;
  removeShortcut: (key: string) => void;
  handleKeyDown: (event: KeyboardEvent) => boolean;
  getShortcutList: () => KeyboardShortcut[];
}

/**
 * キーイベントから一意のキー文字列を生成
 */
function generateKeyString(event: KeyboardEvent): string {
  const parts = [];

  if (event.ctrlKey || event.metaKey) parts.push("ctrl");
  if (event.shiftKey) parts.push("shift");
  if (event.altKey) parts.push("alt");

  // 特殊キーの正規化
  let key = event.key.toLowerCase();
  if (key === " ") key = "space";
  if (key === "escape") key = "esc";

  parts.push(key);

  return parts.join("+");
}

/**
 * ショートカットキーから文字列を生成
 */
function generateShortcutString(shortcut: KeyboardShortcut): string {
  const parts = [];

  if (shortcut.ctrlKey || shortcut.metaKey) parts.push("ctrl");
  if (shortcut.shiftKey) parts.push("shift");
  if (shortcut.altKey) parts.push("alt");

  parts.push(shortcut.key.toLowerCase());

  return parts.join("+");
}

/**
 * キーボードショートカットマネージャーを作成
 */
export function createKeyboardShortcutManager(): KeyboardShortcutManager {
  const shortcuts = new Map<string, KeyboardShortcut>();

  const addShortcut = (shortcut: KeyboardShortcut) => {
    const keyString = generateShortcutString(shortcut);
    shortcuts.set(keyString, shortcut);
  };

  const removeShortcut = (key: string) => {
    shortcuts.delete(key.toLowerCase());
  };

  const handleKeyDown = (event: KeyboardEvent): boolean => {
    // 入力フィールドにフォーカスがある場合はショートカットを無効化
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        (activeElement as HTMLElement).contentEditable === "true")
    ) {
      return false;
    }

    const keyString = generateKeyString(event);
    const shortcut = shortcuts.get(keyString);

    if (shortcut) {
      // 条件チェック
      if (shortcut.condition && !shortcut.condition()) {
        return false;
      }

      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
      return true;
    }

    return false;
  };

  const getShortcutList = (): KeyboardShortcut[] => {
    return Array.from(shortcuts.values());
  };

  return {
    shortcuts,
    addShortcut,
    removeShortcut,
    handleKeyDown,
    getShortcutList,
  };
}

/**
 * デフォルトのキーボードショートカット定義
 */
export const DEFAULT_SHORTCUTS = {
  // セル操作
  MERGE_CELLS: { key: "m", description: "セルを結合" },
  SPLIT_CELLS: { key: "s", description: "セルを分割" },
  SMART_MERGE: { key: "m", shiftKey: true, description: "スマート結合" },

  // スタイル
  BOLD: { key: "b", ctrlKey: true, description: "太字" },

  // テーブル操作
  ADD_ROW: { key: "r", ctrlKey: true, description: "行を追加" },
  ADD_COLUMN: { key: "d", ctrlKey: true, description: "列を追加" },

  // ファイル操作
  EXPORT_SVG: { key: "e", ctrlKey: true, description: "SVGエクスポート" },
  PREVIEW_SVG: { key: "p", ctrlKey: true, description: "SVGプレビュー" },
  NEW_TABLE: { key: "n", ctrlKey: true, description: "新しいテーブル" },

  // その他
  HELP: { key: "h", description: "ヘルプ表示" },
  ESC: { key: "esc", description: "キャンセル・閉じる" },
} as const;

/**
 * ショートカットキーの表示用文字列を生成
 */
export function formatShortcutKey(shortcut: Pick<KeyboardShortcut, "key" | "ctrlKey" | "shiftKey" | "altKey" | "metaKey">): string {
  const parts = [];

  // macOSかどうかを判定
  const isMac = typeof navigator !== "undefined" && (navigator.userAgent.includes("Mac") || navigator.userAgent.includes("Darwin"));

  if (shortcut.ctrlKey || shortcut.metaKey) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (shortcut.shiftKey) {
    parts.push(isMac ? "⇧" : "Shift");
  }
  if (shortcut.altKey) {
    parts.push(isMac ? "⌥" : "Alt");
  }

  // キーの表示名を正規化
  let keyDisplay = shortcut.key.toUpperCase();
  if (keyDisplay === "SPACE") keyDisplay = "␣";
  if (keyDisplay === "ESC") keyDisplay = "Esc";

  parts.push(keyDisplay);

  return parts.join(isMac ? "" : "+");
}
