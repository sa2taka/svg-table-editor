import { describe, expect, it } from "vitest";
import { createTable, setCellStyle, setCellText } from "../../src/models/TableDataModel.js";
import { exportTableToSVG } from "../../src/utils/svgExporter.js";

describe("SVG Exporter", () => {
  describe("exportTableToSVG", () => {
    it("should generate basic SVG structure", () => {
      const table = createTable(2, 2);
      const svg = exportTableToSVG(table, { responsive: false });

      expect(svg).toContain('<svg width="240" height="56"'); // 2 rows * 28px
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain("</svg>");
    });

    it("should include background rectangle", () => {
      const table = createTable(1, 1);
      const svg = exportTableToSVG(table, { responsive: false });

      expect(svg).toContain('<rect width="120" height="28" fill="#ffffff"/>'); // 1 row * 28px
    });

    it("should include CSS styles", () => {
      const table = createTable(1, 1);
      const svg = exportTableToSVG(table);

      expect(svg).toContain("<defs>");
      expect(svg).toContain("<style>");
      expect(svg).toContain(".cell-text");
      expect(svg).toContain("font-family: Arial, sans-serif");
      expect(svg).toContain("font-size: 14px");
    });

    it("should render cell text with proper escaping", () => {
      const table = createTable(1, 1);
      table.cells[0][0].text = 'Hello & "World" <test>';

      const svg = exportTableToSVG(table);

      expect(svg).toContain("Hello &amp; &quot;World&quot; &lt;test&gt;");
    });

    it("should render cell with background color", () => {
      const table = createTable(1, 1);
      table.cells[0][0] = setCellStyle(table, 0, 0, {
        backgroundColor: "#ff0000",
      }).cells[0][0];

      const svg = exportTableToSVG(table);

      expect(svg).toContain('fill="#ff0000"');
    });

    it("should skip transparent background", () => {
      const table = createTable(1, 1);
      table.cells[0][0] = setCellStyle(table, 0, 0, {
        backgroundColor: "transparent",
      }).cells[0][0];

      const svg = exportTableToSVG(table);

      expect(svg).not.toContain('fill="transparent"');
    });

    it("should render cell borders", () => {
      const table = createTable(1, 1);
      table.cells[0][0] = setCellStyle(table, 0, 0, {
        borderColor: {
          top: "#ff0000",
          right: "#00ff00",
          bottom: "#0000ff",
          left: "#ffff00",
        },
      }).cells[0][0];

      const svg = exportTableToSVG(table);

      expect(svg).toContain('stroke="#ff0000"');
      expect(svg).toContain('stroke="#00ff00"');
      expect(svg).toContain('stroke="#0000ff"');
      expect(svg).toContain('stroke="#ffff00"');
    });

    it("should skip transparent borders", () => {
      const table = createTable(1, 1);
      table.cells[0][0] = setCellStyle(table, 0, 0, {
        borderColor: {
          top: "transparent",
          right: "transparent",
          bottom: "transparent",
          left: "transparent",
        },
      }).cells[0][0];

      const svg = exportTableToSVG(table);

      expect(svg).not.toContain('stroke="transparent"');
    });

    it("should render text with proper alignment", () => {
      const table = createTable(1, 3);

      // Left aligned
      table.cells[0][0] = setCellText(table, 0, 0, "Left").cells[0][0];
      table.cells[0][0] = setCellStyle(table, 0, 0, {
        textAlign: "left",
      }).cells[0][0];

      // Center aligned
      table.cells[0][1] = setCellText(table, 0, 1, "Center").cells[0][1];
      table.cells[0][1] = setCellStyle(table, 0, 1, {
        textAlign: "center",
      }).cells[0][1];

      // Right aligned
      table.cells[0][2] = setCellText(table, 0, 2, "Right").cells[0][2];
      table.cells[0][2] = setCellStyle(table, 0, 2, {
        textAlign: "right",
      }).cells[0][2];

      const svg = exportTableToSVG(table);

      expect(svg).toContain('text-anchor="start"');
      expect(svg).toContain('text-anchor="middle"');
      expect(svg).toContain('text-anchor="end"');
    });

    it("should render bold text", () => {
      const table = createTable(1, 1);
      table.cells[0][0] = setCellText(table, 0, 0, "Bold Text").cells[0][0];
      table.cells[0][0] = setCellStyle(table, 0, 0, {
        fontWeight: "bold",
      }).cells[0][0];

      const svg = exportTableToSVG(table);

      expect(svg).toContain('font-weight="bold"');
      expect(svg).toContain("Bold Text");
    });

    it("should render text color", () => {
      const table = createTable(1, 1);
      table.cells[0][0] = setCellText(table, 0, 0, "Colored").cells[0][0];
      table.cells[0][0] = setCellStyle(table, 0, 0, {
        color: "#ff0000",
      }).cells[0][0];

      const svg = exportTableToSVG(table);

      expect(svg).toContain('fill="#ff0000"');
    });

    it("should handle merged cells", () => {
      const table = createTable(2, 2);
      table.cells[0][0].colSpan = 2;
      table.cells[0][0].text = "Merged";
      table.cells[0][1].merged = true;

      const svg = exportTableToSVG(table);

      // Should contain the merged cell with correct width
      expect(svg).toContain("Merged");
      // Should only have one text element for "Merged" (not two)
      const mergedMatches = svg.match(/Merged/g);
      expect(mergedMatches).toHaveLength(1);
    });

    it("should handle custom export options", () => {
      const table = createTable(1, 1);
      const svg = exportTableToSVG(table, {
        responsive: false,
        cellWidth: 200,
        cellHeight: 60,
        fontSize: 16,
        fontFamily: "Times, serif",
        backgroundColor: "#f0f0f0",
      });

      expect(svg).toContain('width="200" height="60"');
      expect(svg).toContain('fill="#f0f0f0"');
      expect(svg).toContain("font-family: Times, serif");
      expect(svg).toContain("font-size: 16px");
    });
  });

  describe("edge cases", () => {
    it("should handle empty table", () => {
      const table = createTable(0, 0);
      table.rows = 0;
      table.columns = 0;
      table.cells = [];

      const svg = exportTableToSVG(table);

      expect(svg).toContain('<svg width="0" height="0"');
      expect(svg).toContain("</svg>");
    });

    it("should handle table with no text", () => {
      const table = createTable(2, 2);

      const svg = exportTableToSVG(table);

      expect(svg).toContain("</svg>");
      expect(svg).not.toContain("<text");
    });

    it("should handle special characters in text", () => {
      const table = createTable(1, 1);
      table.cells[0][0].text = "Special: <>&\"'";

      const svg = exportTableToSVG(table);

      expect(svg).toContain("Special: &lt;&gt;&amp;&quot;&#39;");
    });
  });
});
