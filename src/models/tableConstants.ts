// Constants for table data model

// Color constants
export const TRANSPARENT_COLOR = "#00000000";
export const DEFAULT_BORDER_COLOR = "#000000";
export const DEFAULT_TEXT_COLOR = "#000000";
export const DEFAULT_BACKGROUND_COLOR = TRANSPARENT_COLOR;

// Typography constants
export const DEFAULT_FONT_FAMILY = "Arial";
export const AVAILABLE_FONT_FAMILIES = ["Arial", "Times", "Helvetica", "Georgia", "Verdana"] as const;

// Numeric constants
export const MIN_TABLE_ROWS = 1;
export const MIN_TABLE_COLUMNS = 1;
export const DEFAULT_ROW_SPAN = 1;
export const DEFAULT_COL_SPAN = 1;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_CELL_POSITION: "Invalid cell position",
  INVALID_MERGE_RANGE: "Invalid merge range",
  MERGE_RANGE_START_BEFORE_END: "Invalid merge range: start must be before end",
  CANNOT_MERGE_EXISTING_MERGED_CELLS: "Cannot merge: range contains already merged cells",
  INVALID_MERGED_CELL_REFERENCE: "Invalid merged cell: missing main cell reference",
  CANNOT_REMOVE_ROW_MIN_REQUIRED: "Cannot remove row: table must have at least one row",
  CANNOT_REMOVE_ROW_CONTAINS_MERGED: "Cannot remove row: contains merged cells",
  CANNOT_REMOVE_COLUMN_MIN_REQUIRED: "Cannot remove column: table must have at least one column",
  CANNOT_REMOVE_COLUMN_CONTAINS_MERGED: "Cannot remove column: contains merged cells",
} as const;

// Union types for better type safety
export type FontWeight = "normal" | "bold";
export type TextAlign = "left" | "center" | "right";
export type FontFamily = string; // Keep as string for now to maintain compatibility
