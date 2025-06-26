import { describe, expect, it } from "vitest";
import { createTable, setCellText } from "../src/models/TableDataModel.js";
import { exportTableToSVG } from "../src/utils/svgExporter.js";

describe("Responsive Feature Integration Test", () => {
  it("should produce different SVG sizes for fixed vs responsive mode", () => {
    // Create table with varying text lengths
    let table = createTable(2, 2);
    table = setCellText(table, 0, 0, "Short");
    table = setCellText(table, 0, 1, "This is a very long text that should make the cell much wider than the default");
    table = setCellText(table, 1, 0, "A");
    table = setCellText(table, 1, 1, "Medium length text");

    // Test fixed mode
    const fixedSVG = exportTableToSVG(table, {
      cellWidth: 120,
      cellHeight: 28,
      responsive: false,
    });

    // Test responsive mode
    const responsiveSVG = exportTableToSVG(table, {
      responsive: true,
      minCellWidth: 60,
      maxCellWidth: 300,
      minCellHeight: 20,
      maxCellHeight: 100,
    });

    console.log("=== Fixed Mode SVG ===");
    console.log("First 300 chars:", fixedSVG.substring(0, 300));

    console.log("\n=== Responsive Mode SVG ===");
    console.log("First 300 chars:", responsiveSVG.substring(0, 300));

    // Extract dimensions
    const fixedWidth = /width="(\d+)"/.exec(fixedSVG)?.[1];
    const fixedHeight = /height="(\d+)"/.exec(fixedSVG)?.[1];
    const responsiveWidth = /width="(\d+)"/.exec(responsiveSVG)?.[1];
    const responsiveHeight = /height="(\d+)"/.exec(responsiveSVG)?.[1];

    console.log("\n=== Dimension Comparison ===");
    console.log(`Fixed: ${fixedWidth}x${fixedHeight}`);
    console.log(`Responsive: ${responsiveWidth}x${responsiveHeight}`);

    // Fixed mode should have predictable dimensions
    expect(fixedWidth).toBe("240"); // 2 columns * 120px
    expect(fixedHeight).toBe("56"); // 2 rows * 28px

    // Responsive mode should be different (likely wider due to long text)
    expect(responsiveWidth).not.toBe("240");
    expect(Number(responsiveWidth)).toBeGreaterThan(240);
  });

  it("should show responsive checkbox is working in UI context", () => {
    // Test that the checkbox state affects export options
    const testOptions = {
      responsive: true,
      minCellWidth: 60,
      maxCellWidth: 300,
    };

    // Create a simple table
    let table = createTable(1, 1);
    table = setCellText(table, 0, 0, "Test cell with some content");

    const svg = exportTableToSVG(table, testOptions);

    // Should contain dynamic sizing
    expect(svg).toContain("<svg");
    expect(svg).toContain("width=");
    expect(svg).toContain("height=");

    // Width should not be the default 120px for a single cell
    const width = /width="(\d+)"/.exec(svg)?.[1];
    expect(width).toBeDefined();
    expect(Number(width)).not.toBe(120);
  });
});
