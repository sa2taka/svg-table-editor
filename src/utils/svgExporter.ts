import { CellData, TableDataModel, TRANSPARENT_COLOR } from "../models/TableDataModel.js";
import { calculateOptimalCellSize, FontStyle } from "./textMeasurement.js";

export interface SVGExportOptions {
  // Legacy fixed-size options (maintained for backward compatibility)
  cellWidth?: number;
  cellHeight?: number;
  fontSize?: number;
  fontFamily?: string;
  padding?: number;
  backgroundColor?: string;

  // New responsive options
  responsive?: boolean; // Enable responsive mode
  minCellWidth?: number; // Minimum cell width
  maxCellWidth?: number; // Maximum cell width
  minCellHeight?: number; // Minimum cell height
  maxCellHeight?: number; // Maximum cell height
  textMargin?: number; // Additional margin around text
  autoScale?: boolean; // Auto-scale SVG to fit container
  targetWidth?: number; // Target SVG width for auto-scaling
  maintainAspectRatio?: boolean; // Maintain aspect ratio when scaling
}

const DEFAULT_OPTIONS: Required<SVGExportOptions> = {
  // Legacy options
  cellWidth: 120,
  cellHeight: 28,
  fontSize: 14,
  fontFamily: "Arial, sans-serif",
  padding: 2,
  backgroundColor: "#ffffff",

  // New responsive options
  responsive: true,
  minCellWidth: 60,
  maxCellWidth: 300,
  minCellHeight: 20,
  maxCellHeight: 100,
  textMargin: 4,
  autoScale: false,
  targetWidth: 800,
  maintainAspectRatio: true,
};

interface CellDimensions {
  width: number;
  height: number;
}

interface TableLayout {
  columnWidths: number[];
  rowHeights: number[];
  totalWidth: number;
  totalHeight: number;
}

/**
 * Calculate optimal cell dimensions for responsive mode
 */
function calculateCellDimensions(cell: CellData, opts: Required<SVGExportOptions>): CellDimensions {
  if (!opts.responsive) {
    return { width: opts.cellWidth, height: opts.cellHeight };
  }

  const fontStyle: FontStyle = {
    fontSize: opts.fontSize,
    fontFamily: opts.fontFamily,
    fontWeight: cell.style.fontWeight === "bold" ? "bold" : "normal",
  };

  const { width, height } = calculateOptimalCellSize(
    cell.text,
    fontStyle,
    opts.padding + opts.textMargin,
    opts.minCellWidth,
    opts.minCellHeight
  );

  return {
    width: Math.min(width, opts.maxCellWidth),
    height: Math.min(height, opts.maxCellHeight),
  };
}

/**
 * Calculate table layout with column widths and row heights
 */
function calculateTableLayout(table: TableDataModel, opts: Required<SVGExportOptions>): TableLayout {
  if (!opts.responsive) {
    // Legacy fixed-size layout
    return {
      columnWidths: Array(table.columns).fill(opts.cellWidth) as number[],
      rowHeights: Array(table.rows).fill(opts.cellHeight) as number[],
      totalWidth: table.columns * opts.cellWidth,
      totalHeight: table.rows * opts.cellHeight,
    };
  }

  // Calculate optimal dimensions for each cell
  const cellDimensions: CellDimensions[][] = [];
  for (let row = 0; row < table.rows; row++) {
    cellDimensions[row] = [];
    for (let col = 0; col < table.columns; col++) {
      const cell = table.cells[row][col];
      cellDimensions[row][col] = calculateCellDimensions(cell, opts);
    }
  }

  // Calculate column widths (max width in each column)
  const columnWidths: number[] = [];
  for (let col = 0; col < table.columns; col++) {
    let maxWidth = opts.minCellWidth;
    for (let row = 0; row < table.rows; row++) {
      const cell = table.cells[row][col];
      if (!cell.merged) {
        // For merged cells, distribute width across spanned columns
        const cellWidth = cellDimensions[row][col].width / cell.colSpan;
        maxWidth = Math.max(maxWidth, cellWidth);
      }
    }
    columnWidths[col] = maxWidth;
  }

  // Calculate row heights (max height in each row)
  const rowHeights: number[] = [];
  for (let row = 0; row < table.rows; row++) {
    let maxHeight = opts.minCellHeight;
    for (let col = 0; col < table.columns; col++) {
      const cell = table.cells[row][col];
      if (!cell.merged) {
        // For merged cells, distribute height across spanned rows
        const cellHeight = cellDimensions[row][col].height / cell.rowSpan;
        maxHeight = Math.max(maxHeight, cellHeight);
      }
    }
    rowHeights[row] = maxHeight;
  }

  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
  const totalHeight = rowHeights.reduce((sum, height) => sum + height, 0);

  return {
    columnWidths,
    rowHeights,
    totalWidth,
    totalHeight,
  };
}

export function exportTableToSVG(table: TableDataModel, options: SVGExportOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Calculate table layout
  const layout = calculateTableLayout(table, opts);

  // Determine final SVG dimensions
  let svgWidth = layout.totalWidth;
  let svgHeight = layout.totalHeight;
  const viewBox = `0 0 ${layout.totalWidth} ${layout.totalHeight}`;

  // Apply auto-scaling if enabled
  if (opts.autoScale && opts.targetWidth && opts.targetWidth < layout.totalWidth) {
    const scale = opts.targetWidth / layout.totalWidth;
    svgWidth = opts.targetWidth;

    if (opts.maintainAspectRatio) {
      svgHeight = layout.totalHeight * scale;
    }
  }

  // Create SVG root element
  let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">`;

  // Add background
  svgContent += `<rect width="${layout.totalWidth}" height="${layout.totalHeight}" fill="${opts.backgroundColor}"/>`;

  // Add styles
  svgContent += `<defs>
    <style>
      .cell-text {
        font-family: ${opts.fontFamily};
        font-size: ${opts.fontSize}px;
        dominant-baseline: middle;
        text-anchor: start;
      }
      .cell-background {
        opacity: 1;
      }
    </style>
  </defs>`;

  // Render cells
  for (let row = 0; row < table.rows; row++) {
    for (let col = 0; col < table.columns; col++) {
      const cell = table.cells[row][col];

      // Skip merged cells (they are rendered by their main cell)
      if (cell.merged) {
        continue;
      }

      svgContent += renderCell(cell, opts, layout);
    }
  }

  svgContent += "</svg>";
  return svgContent;
}

function renderCell(cell: CellData, opts: Required<SVGExportOptions>, layout: TableLayout): string {
  // Calculate cell position and dimensions from layout
  let x = 0;
  let y = 0;

  // Sum column widths before this cell
  for (let col = 0; col < cell.column; col++) {
    x += layout.columnWidths[col];
  }

  // Sum row heights before this cell
  for (let row = 0; row < cell.row; row++) {
    y += layout.rowHeights[row];
  }

  // Calculate cell dimensions (including merged cells)
  let width = 0;
  let height = 0;

  // Sum widths for merged columns
  for (let col = cell.column; col < cell.column + cell.colSpan; col++) {
    width += layout.columnWidths[col];
  }

  // Sum heights for merged rows
  for (let row = cell.row; row < cell.row + cell.rowSpan; row++) {
    height += layout.rowHeights[row];
  }

  let cellContent = "";

  // Cell background
  if (cell.style.backgroundColor && cell.style.backgroundColor !== TRANSPARENT_COLOR) {
    cellContent += `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${cell.style.backgroundColor}" class="cell-background"/>`;
  }

  // Cell borders
  const borderTop = cell.style.borderColor.top !== TRANSPARENT_COLOR ? cell.style.borderColor.top : "none";
  const borderRight = cell.style.borderColor.right !== TRANSPARENT_COLOR ? cell.style.borderColor.right : "none";
  const borderBottom = cell.style.borderColor.bottom !== TRANSPARENT_COLOR ? cell.style.borderColor.bottom : "none";
  const borderLeft = cell.style.borderColor.left !== TRANSPARENT_COLOR ? cell.style.borderColor.left : "none";

  // Draw borders
  if (borderTop !== "none") {
    cellContent += `<line x1="${x}" y1="${y}" x2="${x + width}" y2="${y}" stroke="${borderTop}" stroke-width="1"/>`;
  }
  if (borderRight !== "none") {
    cellContent += `<line x1="${x + width}" y1="${y}" x2="${x + width}" y2="${y + height}" stroke="${borderRight}" stroke-width="1"/>`;
  }
  if (borderBottom !== "none") {
    cellContent += `<line x1="${x}" y1="${y + height}" x2="${x + width}" y2="${y + height}" stroke="${borderBottom}" stroke-width="1"/>`;
  }
  if (borderLeft !== "none") {
    cellContent += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + height}" stroke="${borderLeft}" stroke-width="1"/>`;
  }

  // Cell text
  if (cell.text) {
    const textX = getTextX(x, width, cell.style.textAlign, opts.padding);
    const fontWeight = cell.style.fontWeight === "bold" ? "bold" : "normal";
    const textColor = cell.style.color;
    const fontFamily = cell.style.fontFamily || opts.fontFamily;
    const textAnchor = getTextAnchor(cell.style.textAlign);

    // 改行でテキストを分割
    const lines = cell.text.split("\n");
    const lineHeight = opts.fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = y + (height - totalHeight) / 2 + opts.fontSize * 0.8;

    cellContent += `<text x="${textX}" y="${startY}" class="cell-text" font-weight="${fontWeight}" fill="${textColor}" font-family="${fontFamily}" text-anchor="${textAnchor}">`;

    lines.forEach((line, index) => {
      const dy = index === 0 ? 0 : lineHeight;
      cellContent += `<tspan x="${textX}" dy="${dy}">${escapeXml(line)}</tspan>`;
    });

    cellContent += `</text>`;
  }

  return cellContent;
}

function getTextX(cellX: number, cellWidth: number, textAlign: string, padding: number): number {
  switch (textAlign) {
    case "center":
      return cellX + cellWidth / 2;
    case "right":
      return cellX + cellWidth - padding;
    default: // left
      return cellX + padding;
  }
}

function getTextAnchor(textAlign: string): string {
  switch (textAlign) {
    case "center":
      return "middle";
    case "right":
      return "end";
    default: // left
      return "start";
  }
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function downloadSVG(svgContent: string, filename = "table.svg"): void {
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
