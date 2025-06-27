import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { CellSelection } from "../models/CellSelection.js";
import { createTable, DEFAULT_BORDER_COLOR, TableDataModel, TRANSPARENT_COLOR } from "../models/TableDataModel.js";

export interface AppState {
  table: TableDataModel;
  selection: CellSelection | null;
}

/**
 * Minimized representation of table data for URL compression
 */
interface MinimizedState {
  rows: number;
  cols: number;
  cells: {
    r: number; // row
    c: number; // column
    t?: string; // text
    cs?: number; // colSpan
    rs?: number; // rowSpan
    m?: boolean; // merged
    s?: {
      bg?: string; // backgroundColor
      color?: string;
      fw?: string; // fontWeight
      ta?: string; // textAlign
      ff?: string; // fontFamily
      bt?: string; // borderColor.top
      br?: string; // borderColor.right
      bb?: string; // borderColor.bottom
      bl?: string; // borderColor.left
    };
  }[];
  sel?: {
    sr: number; // startRow
    sc: number; // startColumn
    er: number; // endRow
    ec: number; // endColumn
  } | null;
  gs?: {
    iv?: string; // innerVertical
    ih?: string; // innerHorizontal
  };
}

/**
 * Converts full state to minimized representation
 */
const minimizeState = (state: AppState): MinimizedState => {
  const minimized: MinimizedState = {
    rows: state.table.rows,
    cols: state.table.columns,
    cells: [],
  };

  // Only include non-empty cells
  for (let row = 0; row < state.table.rows; row++) {
    for (let col = 0; col < state.table.columns; col++) {
      const cell = state.table.cells[row][col];

      // Skip completely empty cells
      if (
        !cell.text &&
        !cell.merged &&
        (cell.colSpan || 1) === 1 &&
        (cell.rowSpan || 1) === 1 &&
        (cell.style.backgroundColor || TRANSPARENT_COLOR) === TRANSPARENT_COLOR &&
        (cell.style.color || "#000000") === "#000000" &&
        cell.style.fontWeight === "normal" &&
        cell.style.textAlign === "left" &&
        (cell.style.fontFamily || "Arial") === "Arial" &&
        (cell.style.borderColor.top || DEFAULT_BORDER_COLOR) === DEFAULT_BORDER_COLOR &&
        (cell.style.borderColor.right || DEFAULT_BORDER_COLOR) === DEFAULT_BORDER_COLOR &&
        (cell.style.borderColor.bottom || DEFAULT_BORDER_COLOR) === DEFAULT_BORDER_COLOR &&
        (cell.style.borderColor.left || DEFAULT_BORDER_COLOR) === DEFAULT_BORDER_COLOR
      ) {
        continue;
      }

      const minCell: MinimizedState["cells"][0] = {
        r: row,
        c: col,
      };

      if (cell.text) minCell.t = cell.text;
      if ((cell.colSpan || 1) !== 1) minCell.cs = cell.colSpan;
      if ((cell.rowSpan || 1) !== 1) minCell.rs = cell.rowSpan;
      if (cell.merged) minCell.m = true;

      // Only include non-default styles
      const style: MinimizedState["cells"][0]["s"] = {};
      const cellStyle = cell.style;
      if (cellStyle.backgroundColor !== TRANSPARENT_COLOR) style.bg = cellStyle.backgroundColor;
      if (cellStyle.color !== "#000000") style.color = cellStyle.color;
      if (cellStyle.fontWeight !== "normal") style.fw = cellStyle.fontWeight;
      if (cellStyle.textAlign !== "left") style.ta = cellStyle.textAlign;
      if (cellStyle.fontFamily !== "Arial") style.ff = cellStyle.fontFamily;
      if (cellStyle.borderColor.top !== DEFAULT_BORDER_COLOR) style.bt = cellStyle.borderColor.top;
      if (cellStyle.borderColor.right !== DEFAULT_BORDER_COLOR) style.br = cellStyle.borderColor.right;
      if (cellStyle.borderColor.bottom !== DEFAULT_BORDER_COLOR) style.bb = cellStyle.borderColor.bottom;
      if (cellStyle.borderColor.left !== DEFAULT_BORDER_COLOR) style.bl = cellStyle.borderColor.left;

      if (Object.keys(style).length > 0) minCell.s = style;

      minimized.cells.push(minCell);
    }
  }

  // Include selection if present
  if (state.selection) {
    minimized.sel = {
      sr: state.selection.startRow,
      sc: state.selection.startColumn,
      er: state.selection.endRow,
      ec: state.selection.endColumn,
    };
  }

  // Include gridStyle if present (always save, even if default values)
  if (state.table.gridStyle) {
    minimized.gs = {
      iv: state.table.gridStyle.innerVertical,
      ih: state.table.gridStyle.innerHorizontal,
    };
  }

  return minimized;
};

/**
 * Check if debug mode is enabled via URL parameter
 */
const isDebugMode = (): boolean => {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get("debug") === "true";
  } catch {
    return false;
  }
};

/**
 * Debug logging helper that only logs when debug mode is enabled
 */
const debugLog = {
  group: (message: string) => {
    if (isDebugMode()) {
      // eslint-disable-next-line no-console
      console.group(message);
    }
  },
  groupEnd: () => {
    if (isDebugMode()) {
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  },
  log: (message: string, data?: unknown) => {
    if (isDebugMode()) {
      // eslint-disable-next-line no-console
      console.log(message, data);
    }
  },
  warn: (message: string, data?: unknown) => {
    if (isDebugMode()) {
      // eslint-disable-next-line no-console
      console.warn(message, data);
    }
  },
  error: (message: string, data?: unknown) => {
    if (isDebugMode()) {
      // eslint-disable-next-line no-console
      console.error(message, data);
    }
  },
};

/**
 * Serializes app state to a compressed URL-safe string
 */
export const serializeStateToURL = (state: AppState): string => {
  try {
    // Check if state has the expected structure
    if (typeof state.table.rows !== "number" || typeof state.table.columns !== "number") {
      return "";
    }

    const minimized = minimizeState(state);

    // Debug logging when debug=true in URL
    if (isDebugMode()) {
      debugLog.group("🔍 URL State Debug - Serialization");
      debugLog.log("📊 Original State:", {
        table: {
          rows: state.table.rows,
          columns: state.table.columns,
          gridStyle: state.table.gridStyle,
          cellsWithContent: state.table.cells
            .flat()
            .filter(
              (cell) =>
                cell.text ||
                cell.merged ||
                cell.colSpan > 1 ||
                cell.rowSpan > 1 ||
                cell.style.backgroundColor !== "transparent" ||
                cell.style.color !== "#000000" ||
                cell.style.fontWeight !== "normal" ||
                cell.style.textAlign !== "left" ||
                cell.style.fontFamily !== "Arial" ||
                Object.values(cell.style.borderColor).some((color) => color !== "transparent")
            ).length,
        },
        selection: state.selection,
      });
      debugLog.log("📦 Minimized State:", minimized);

      const jsonString = JSON.stringify(minimized);
      const compressed = compressToEncodedURIComponent(jsonString);

      debugLog.log("📏 Compression Stats:", {
        originalSize: jsonString.length,
        compressedSize: compressed ? compressed.length : 0,
        compressionRatio: compressed ? (((jsonString.length - compressed.length) / jsonString.length) * 100).toFixed(1) + "%" : "N/A",
      });
      debugLog.log("🔗 Compressed URL Data:", compressed);
      debugLog.groupEnd();

      return compressed || "";
    }

    const jsonString = JSON.stringify(minimized);
    const compressed = compressToEncodedURIComponent(jsonString);
    return compressed || "";
  } catch (error) {
    debugLog.error("❌ URL State Debug - Serialization Error:", error);
    return "";
  }
};

/**
 * Expands minimized state back to full state
 */
const expandState = (minimized: MinimizedState): AppState => {
  // Create empty table
  const table = createTable(minimized.rows, minimized.cols);

  // Restore cells
  for (const minCell of minimized.cells) {
    const cell = table.cells[minCell.r][minCell.c];

    if (minCell.t) cell.text = minCell.t;
    if (minCell.cs) cell.colSpan = minCell.cs;
    if (minCell.rs) cell.rowSpan = minCell.rs;
    if (minCell.m) cell.merged = minCell.m;

    if (minCell.s) {
      const style = minCell.s;
      if (style.bg) cell.style.backgroundColor = style.bg;
      if (style.color) cell.style.color = style.color;
      if (style.fw) cell.style.fontWeight = style.fw as "normal" | "bold";
      if (style.ta) cell.style.textAlign = style.ta as "left" | "center" | "right";
      if (style.ff) cell.style.fontFamily = style.ff;

      // Create new borderColor object to ensure proper restoration
      cell.style.borderColor = {
        top: style.bt ?? cell.style.borderColor.top,
        right: style.br ?? cell.style.borderColor.right,
        bottom: style.bb ?? cell.style.borderColor.bottom,
        left: style.bl ?? cell.style.borderColor.left,
      };
    }
  }

  // Restore gridStyle if present
  if (minimized.gs) {
    table.gridStyle = {
      innerVertical: minimized.gs.iv ?? DEFAULT_BORDER_COLOR,
      innerHorizontal: minimized.gs.ih ?? DEFAULT_BORDER_COLOR,
    };
  }

  // Restore selection
  const selection = minimized.sel
    ? {
        startRow: minimized.sel.sr,
        startColumn: minimized.sel.sc,
        endRow: minimized.sel.er,
        endColumn: minimized.sel.ec,
      }
    : null;

  return { table, selection };
};

/**
 * Deserializes app state from a compressed URL-safe string
 */
export const deserializeStateFromURL = (encodedState: string): AppState | null => {
  try {
    if (!encodedState) {
      debugLog.log("🔍 URL State Debug - No encoded state provided");
      return null;
    }

    debugLog.group("🔍 URL State Debug - Deserialization");
    debugLog.log("📥 Encoded State Length:", encodedState.length);
    debugLog.log("📥 Encoded State Preview:", encodedState.substring(0, 100) + (encodedState.length > 100 ? "..." : ""));

    // Try new compressed format first
    const decompressed = decompressFromEncodedURIComponent(encodedState);
    if (decompressed) {
      const minimized = JSON.parse(decompressed) as MinimizedState;
      const expandedState = expandState(minimized);

      debugLog.log("✅ Using new compressed format");
      debugLog.log("📦 Decompressed JSON:", decompressed);
      debugLog.log("📊 Minimized State:", minimized);
      debugLog.log("🎯 Expanded State:", {
        table: {
          rows: expandedState.table.rows,
          columns: expandedState.table.columns,
          gridStyle: expandedState.table.gridStyle,
          cellsWithContent: expandedState.table.cells
            .flat()
            .filter(
              (cell) =>
                cell.text ||
                cell.merged ||
                cell.colSpan > 1 ||
                cell.rowSpan > 1 ||
                cell.style.backgroundColor !== "transparent" ||
                cell.style.color !== "#000000" ||
                cell.style.fontWeight !== "normal" ||
                cell.style.textAlign !== "left" ||
                cell.style.fontFamily !== "Arial" ||
                Object.values(cell.style.borderColor).some((color) => color !== "transparent")
            ).length,
        },
        selection: expandedState.selection,
      });
      debugLog.groupEnd();

      return expandedState;
    }

    // Fallback to old format for backward compatibility
    debugLog.log("⚠️ Falling back to old Base64 format");

    let base64String = encodedState.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    base64String += padding;

    const jsonString = atob(base64String);
    const state = JSON.parse(jsonString) as AppState;

    // Validate the state structure
    if (!Array.isArray(state.table.cells)) {
      debugLog.error("❌ Invalid state structure: cells is not an array");
      debugLog.groupEnd();
      return null;
    }

    debugLog.log("✅ Successfully parsed old format");
    debugLog.log("🎯 Parsed State:", {
      table: {
        rows: state.table.rows,
        columns: state.table.columns,
        gridStyle: state.table.gridStyle,
      },
      selection: state.selection,
    });
    debugLog.groupEnd();

    return state;
  } catch (error) {
    debugLog.error("❌ URL State Debug - Deserialization Error:", error);
    debugLog.groupEnd();
    return null;
  }
};

/**
 * Updates the URL with the current state
 */
export const updateURLWithState = (state: AppState): void => {
  try {
    const encodedState = serializeStateToURL(state);
    if (encodedState) {
      const url = new URL(window.location.href);
      const oldState = url.searchParams.get("state");
      url.searchParams.set("state", encodedState);

      debugLog.group("🔍 URL State Debug - URL Update");
      debugLog.log("🔄 Updating URL with new state");
      debugLog.log("📏 Old state length:", oldState?.length ?? 0);
      debugLog.log("📏 New state length:", encodedState.length);
      debugLog.log("🔗 New URL:", url.toString());
      debugLog.groupEnd();

      window.history.replaceState({}, "", url.toString());
    } else {
      debugLog.warn("⚠️ URL State Debug - No encoded state to save");
    }
  } catch (error) {
    debugLog.error("❌ URL State Debug - URL Update Error:", error);
  }
};

/**
 * Gets the state from the current URL
 */
export const getStateFromURL = (): AppState | null => {
  try {
    const url = new URL(window.location.href);
    const encodedState = url.searchParams.get("state");

    debugLog.group("🔍 URL State Debug - URL Retrieval");
    debugLog.log("🔗 Current URL:", url.toString());
    debugLog.log("📥 Encoded state found:", !!encodedState);
    if (encodedState) {
      debugLog.log("📏 Encoded state length:", encodedState.length);
    }
    debugLog.groupEnd();

    return encodedState ? deserializeStateFromURL(encodedState) : null;
  } catch (error) {
    debugLog.error("❌ URL State Debug - URL Retrieval Error:", error);
    return null;
  }
};

/**
 * Clears the state from the URL
 */
export const clearStateFromURL = (): void => {
  try {
    const url = new URL(window.location.href);
    const hadState = url.searchParams.has("state");
    url.searchParams.delete("state");

    debugLog.group("🔍 URL State Debug - Clear URL State");
    debugLog.log("🗑️ Clearing state from URL");
    debugLog.log("📥 Had state before clearing:", hadState);
    debugLog.log("🔗 New URL:", url.toString());
    debugLog.groupEnd();

    window.history.replaceState({}, "", url.toString());
  } catch (error) {
    debugLog.error("❌ URL State Debug - Clear URL Error:", error);
  }
};
