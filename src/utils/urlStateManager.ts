import { TableDataModel, createTable } from "../models/TableDataModel.js";
import { CellSelection } from "../models/CellSelection.js";
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

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
  cells: Array<{
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
  }>;
  sel?: {
    sr: number; // startRow
    sc: number; // startColumn
    er: number; // endRow
    ec: number; // endColumn
  } | null;
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
      const cell = state.table.cells?.[row]?.[col];
      if (!cell) continue;
      
      // Skip completely empty cells
      if (!cell.text && 
          !cell.merged && 
          (cell.colSpan ?? 1) === 1 && 
          (cell.rowSpan ?? 1) === 1 &&
          (cell.style?.backgroundColor ?? "transparent") === "transparent" &&
          (cell.style?.color ?? "#000000") === "#000000" &&
          (cell.style?.fontWeight ?? "normal") === "normal" &&
          (cell.style?.textAlign ?? "left") === "left" &&
          (cell.style?.fontFamily ?? "Arial") === "Arial" &&
          (cell.style?.borderColor?.top ?? "transparent") === "transparent" &&
          (cell.style?.borderColor?.right ?? "transparent") === "transparent" &&
          (cell.style?.borderColor?.bottom ?? "transparent") === "transparent" &&
          (cell.style?.borderColor?.left ?? "transparent") === "transparent") {
        continue;
      }

      const minCell: MinimizedState['cells'][0] = {
        r: row,
        c: col,
      };

      if (cell.text) minCell.t = cell.text;
      if ((cell.colSpan ?? 1) !== 1) minCell.cs = cell.colSpan;
      if ((cell.rowSpan ?? 1) !== 1) minCell.rs = cell.rowSpan;
      if (cell.merged) minCell.m = true;

      // Only include non-default styles
      const style: MinimizedState['cells'][0]['s'] = {};
      const cellStyle = cell.style;
      if (cellStyle) {
        if ((cellStyle.backgroundColor ?? "transparent") !== "transparent") style.bg = cellStyle.backgroundColor;
        if ((cellStyle.color ?? "#000000") !== "#000000") style.color = cellStyle.color;
        if ((cellStyle.fontWeight ?? "normal") !== "normal") style.fw = cellStyle.fontWeight;
        if ((cellStyle.textAlign ?? "left") !== "left") style.ta = cellStyle.textAlign;
        if ((cellStyle.fontFamily ?? "Arial") !== "Arial") style.ff = cellStyle.fontFamily;
        if (cellStyle.borderColor) {
          if ((cellStyle.borderColor.top ?? "transparent") !== "transparent") style.bt = cellStyle.borderColor.top;
          if ((cellStyle.borderColor.right ?? "transparent") !== "transparent") style.br = cellStyle.borderColor.right;
          if ((cellStyle.borderColor.bottom ?? "transparent") !== "transparent") style.bb = cellStyle.borderColor.bottom;
          if ((cellStyle.borderColor.left ?? "transparent") !== "transparent") style.bl = cellStyle.borderColor.left;
        }
      }

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

  return minimized;
};

/**
 * Serializes app state to a compressed URL-safe string
 */
export const serializeStateToURL = (state: AppState): string => {
  try {
    // Check if state has the expected structure
    if (!state || !state.table || typeof state.table.rows !== 'number' || typeof state.table.columns !== 'number') {
      return "";
    }

    const minimized = minimizeState(state);
    const jsonString = JSON.stringify(minimized);
    const compressed = compressToEncodedURIComponent(jsonString);
    return compressed || "";
  } catch {
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
      if (style.bt) cell.style.borderColor.top = style.bt;
      if (style.br) cell.style.borderColor.right = style.br;
      if (style.bb) cell.style.borderColor.bottom = style.bb;
      if (style.bl) cell.style.borderColor.left = style.bl;
    }
  }
  
  // Restore selection
  const selection = minimized.sel ? {
    startRow: minimized.sel.sr,
    startColumn: minimized.sel.sc,
    endRow: minimized.sel.er,
    endColumn: minimized.sel.ec,
  } : null;
  
  return { table, selection };
};

/**
 * Deserializes app state from a compressed URL-safe string
 */
export const deserializeStateFromURL = (encodedState: string): AppState | null => {
  try {
    if (!encodedState) return null;
    
    // Try new compressed format first
    const decompressed = decompressFromEncodedURIComponent(encodedState);
    if (decompressed) {
      const minimized = JSON.parse(decompressed) as MinimizedState;
      return expandState(minimized);
    }
    
    // Fallback to old format for backward compatibility
    let base64String = encodedState.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    base64String += padding;
    
    const jsonString = atob(base64String);
    const state = JSON.parse(jsonString) as AppState;
    
    // Validate the state structure
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-unnecessary-condition
    if (!state || !state.table || !state.table.cells) {
      return null;
    }
    
    if (!Array.isArray(state.table.cells)) {
      return null;
    }
    
    return state;
  } catch {
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
      url.searchParams.set('state', encodedState);
      window.history.replaceState({}, '', url.toString());
    }
  } catch {
    // Silently fail
  }
};

/**
 * Gets the state from the current URL
 */
export const getStateFromURL = (): AppState | null => {
  try {
    const url = new URL(window.location.href);
    const encodedState = url.searchParams.get('state');
    return encodedState ? deserializeStateFromURL(encodedState) : null;
  } catch {
    return null;
  }
};

/**
 * Clears the state from the URL
 */
export const clearStateFromURL = (): void => {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('state');
    window.history.replaceState({}, '', url.toString());
  } catch {
    // Silently fail
  }
};