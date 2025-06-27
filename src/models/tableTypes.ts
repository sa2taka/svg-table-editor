import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_BORDER_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_TEXT_COLOR,
  FontFamily,
  FontWeight,
  TextAlign,
} from "./tableConstants.js";

// Re-export types and constants for convenience
export { DEFAULT_BORDER_COLOR, TRANSPARENT_COLOR } from "./tableConstants.js";
export type { FontFamily, FontWeight, TextAlign } from "./tableConstants.js";

export interface BorderStyle {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export interface GridBorderStyle {
  outer: BorderStyle;
  innerVertical: string;
  innerHorizontal: string;
}

export interface CellStyle {
  fontWeight: FontWeight;
  color: string;
  fontFamily: FontFamily;
  textAlign: TextAlign;
  backgroundColor: string;
  borderColor: BorderStyle;
}

export interface CellData {
  row: number;
  column: number;
  text: string;
  style: CellStyle;
  merged: boolean;
  rowSpan: number;
  colSpan: number;
  mainCellRow?: number;
  mainCellColumn?: number;
}

export interface TableDataModel {
  rows: number;
  columns: number;
  cells: CellData[][];
  gridStyle?: {
    innerVertical: string;
    innerHorizontal: string;
  };
}

// Default style constants
export const DEFAULT_BORDER_STYLE: BorderStyle = {
  top: DEFAULT_BORDER_COLOR,
  right: DEFAULT_BORDER_COLOR,
  bottom: DEFAULT_BORDER_COLOR,
  left: DEFAULT_BORDER_COLOR,
};

export const DEFAULT_STYLE: CellStyle = {
  fontWeight: "normal",
  color: DEFAULT_TEXT_COLOR,
  fontFamily: DEFAULT_FONT_FAMILY,
  textAlign: "left",
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  borderColor: { ...DEFAULT_BORDER_STYLE },
};
