import { describe, expect, it } from "vitest";
import { createTable, setCellText } from "../../src/models/TableDataModel.js";
import { exportTableToSVG, SVGExportOptions } from "../../src/utils/svgExporter.js";

describe("Responsive SVG Export", () => {
  const defaultOptions: SVGExportOptions = {
    cellWidth: 120,
    cellHeight: 28,
    fontSize: 14,
    fontFamily: "Arial, sans-serif",
    padding: 2,
    backgroundColor: "#ffffff",
  };

  const responsiveOptions: SVGExportOptions = {
    ...defaultOptions,
    responsive: true,
    minCellWidth: 60,
    maxCellWidth: 300,
    minCellHeight: 20,
    maxCellHeight: 100,
    textMargin: 4,
  };

  describe("Fixed Size Mode (Legacy)", () => {
    it("should generate fixed-size SVG when responsive is disabled", () => {
      const table = createTable(2, 2);
      const svg = exportTableToSVG(table, { ...defaultOptions, responsive: false });

      expect(svg).toContain('width="240"'); // 2 columns * 120px
      expect(svg).toContain('height="56"'); // 2 rows * 28px
      expect(svg).toContain('viewBox="0 0 240 56"');
    });

    it("should position cells correctly in fixed mode", () => {
      const table = createTable(2, 2);
      const svg = exportTableToSVG(table, { ...defaultOptions, responsive: false });

      // Check for correct line positioning (borders show cell positions)
      expect(svg).toContain('x1="0"'); // Left border at x=0
      expect(svg).toContain('x1="120"'); // Middle vertical line at x=120
      expect(svg).toContain('x2="240"'); // Right border at x=240
      expect(svg).toContain('y1="0"'); // Top border at y=0
      expect(svg).toContain('y1="28"'); // Middle horizontal line at y=28
      expect(svg).toContain('y2="56"'); // Bottom border at y=56
    });
  });

  describe("Responsive Mode", () => {
    it("should enable responsive mode when option is set", () => {
      const table = createTable(1, 1);
      const svg = exportTableToSVG(table, responsiveOptions);

      // Should generate valid SVG
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it("should handle empty cells with minimum dimensions", () => {
      const table = createTable(1, 1);
      const svg = exportTableToSVG(table, responsiveOptions);

      // Should use minimum dimensions for empty cells
      expect(svg).toContain('width="60"'); // minCellWidth
      expect(svg).toContain('height="20"'); // minCellHeight
    });

    it("should adjust cell size based on text content", () => {
      let table = createTable(1, 2);
      table = setCellText(table, 0, 0, "Short");
      table = setCellText(table, 0, 1, "This is a much longer text that should require a wider cell");

      const svg = exportTableToSVG(table, responsiveOptions);

      // Should generate different column widths
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");

      // Total width should be greater than minimum for both cells
      const widthMatch = /width="(\d+)"/.exec(svg);
      expect(widthMatch).toBeTruthy();
      if (widthMatch) {
        const totalWidth = parseInt(widthMatch[1]);
        expect(totalWidth).toBeGreaterThan(120); // Should be wider than 2 * minCellWidth
      }
    });

    it("should respect maximum cell dimensions", () => {
      let table = createTable(1, 1);
      // Very long text that would exceed maxCellWidth if unconstrained
      const longText = "A".repeat(1000);
      table = setCellText(table, 0, 0, longText);

      const svg = exportTableToSVG(table, responsiveOptions);

      // Width should not exceed maxCellWidth (300)
      const widthMatch = /width="(\d+)"/.exec(svg);
      expect(widthMatch).toBeTruthy();
      if (widthMatch) {
        const totalWidth = parseInt(widthMatch[1]);
        expect(totalWidth).toBeLessThanOrEqual(300);
      }
    });

    it("should handle different font weights", () => {
      let table = createTable(1, 2);
      table = setCellText(table, 0, 0, "Normal Text");
      table = setCellText(table, 0, 1, "Bold Text");

      // Make second cell bold
      const boldCell = table.cells[0][1];
      boldCell.style.fontWeight = "bold";

      const svg = exportTableToSVG(table, responsiveOptions);

      // Should handle both font weights correctly
      expect(svg).toContain('font-weight="normal"');
      expect(svg).toContain('font-weight="bold"');
    });
  });

  describe("Merged Cells in Responsive Mode", () => {
    it("should handle merged cells correctly", () => {
      let table = createTable(2, 2);
      table = setCellText(table, 0, 0, "Merged Cell");

      // Simulate merged cell (colSpan = 2)
      table.cells[0][0].colSpan = 2;
      table.cells[0][1].merged = true;
      table.cells[0][1].mainCellRow = 0;
      table.cells[0][1].mainCellColumn = 0;

      const svg = exportTableToSVG(table, responsiveOptions);

      // Should generate valid SVG with merged cells
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
    });
  });

  describe("Text Positioning", () => {
    it("should position text correctly for different alignments", () => {
      let table = createTable(1, 3);
      table = setCellText(table, 0, 0, "Left");
      table = setCellText(table, 0, 1, "Center");
      table = setCellText(table, 0, 2, "Right");

      // Set text alignments
      table.cells[0][0].style.textAlign = "left";
      table.cells[0][1].style.textAlign = "center";
      table.cells[0][2].style.textAlign = "right";

      const svg = exportTableToSVG(table, responsiveOptions);

      // Should contain different text-anchor values
      expect(svg).toContain('text-anchor="start"'); // left alignment
      expect(svg).toContain('text-anchor="middle"'); // center alignment
      expect(svg).toContain('text-anchor="end"'); // right alignment
    });
  });

  describe("Auto-scaling", () => {
    it("should apply auto-scaling when enabled", () => {
      const table = createTable(1, 1);
      const autoScaleOptions: SVGExportOptions = {
        ...responsiveOptions,
        autoScale: true,
        targetWidth: 200,
        maintainAspectRatio: true,
      };

      const svg = exportTableToSVG(table, autoScaleOptions);

      // Should contain viewBox for scaling
      expect(svg).toContain("viewBox=");
      expect(svg).toContain("<svg");
    });
  });

  describe("Background and Borders", () => {
    it("should render cell backgrounds in responsive mode", () => {
      let table = createTable(1, 1);
      table = setCellText(table, 0, 0, "Colored");
      table.cells[0][0].style.backgroundColor = "#ffcc00";

      const svg = exportTableToSVG(table, responsiveOptions);

      expect(svg).toContain('fill="#ffcc00"');
    });

    it("should render cell borders in responsive mode", () => {
      let table = createTable(1, 1);
      table = setCellText(table, 0, 0, "Bordered");
      table.cells[0][0].style.borderColor = {
        top: "#ff0000",
        right: "#00ff00",
        bottom: "#0000ff",
        left: "#ffff00",
      };

      const svg = exportTableToSVG(table, responsiveOptions);

      expect(svg).toContain('stroke="#ff0000"'); // top border
      expect(svg).toContain('stroke="#00ff00"'); // right border
      expect(svg).toContain('stroke="#0000ff"'); // bottom border
      expect(svg).toContain('stroke="#ffff00"'); // left border
    });
  });

  describe("Edge Cases", () => {
    it("should handle very small table", () => {
      const table = createTable(1, 1);
      const svg = exportTableToSVG(table, responsiveOptions);

      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
    });

    it("should handle table with only whitespace", () => {
      let table = createTable(1, 1);
      table = setCellText(table, 0, 0, "   ");

      const svg = exportTableToSVG(table, responsiveOptions);

      // Should use minimum dimensions
      expect(svg).toContain('width="60"'); // minCellWidth
      expect(svg).toContain('height="20"'); // minCellHeight
    });

    it("should handle special characters", () => {
      let table = createTable(1, 1);
      table = setCellText(table, 0, 0, "Special: <>&\"'");

      const svg = exportTableToSVG(table, responsiveOptions);

      // Should escape XML special characters
      expect(svg).toContain("&lt;");
      expect(svg).toContain("&gt;");
      expect(svg).toContain("&amp;");
      expect(svg).toContain("&quot;");
      expect(svg).toContain("&#39;");
    });
  });
});
