import { beforeEach, describe, expect, it } from "vitest";
import {
  calculateOptimalCellSize,
  clearMeasurementCache,
  estimateTextWidth,
  FontStyle,
  getAverageCharWidth,
  measureMultilineText,
  measureText,
  measureTextCached,
} from "../../src/utils/textMeasurement.js";

describe("Text Measurement", () => {
  const defaultFontStyle: FontStyle = {
    fontSize: 14,
    fontFamily: "Arial",
    fontWeight: "normal",
  };

  beforeEach(() => {
    clearMeasurementCache();
  });

  describe("measureText", () => {
    it("should measure basic text dimensions", () => {
      const text = "Hello World";
      const metrics = measureText(text, defaultFontStyle);

      expect(metrics.width).toBeGreaterThan(0);
      expect(metrics.height).toBeGreaterThan(0);
      expect(metrics.ascent).toBeGreaterThan(0);
      expect(metrics.descent).toBeGreaterThan(0);
    });

    it("should handle empty text", () => {
      const metrics = measureText("", defaultFontStyle);

      expect(metrics.width).toBe(0);
      expect(metrics.height).toBeGreaterThan(0); // Font height exists even for empty text
    });

    it("should respect font weight", () => {
      const normalMetrics = measureText("Test", { ...defaultFontStyle, fontWeight: "normal" });
      const boldMetrics = measureText("Test", { ...defaultFontStyle, fontWeight: "bold" });

      expect(boldMetrics.width).toBeGreaterThanOrEqual(normalMetrics.width);
    });

    it("should respect font size", () => {
      const smallMetrics = measureText("Test", { ...defaultFontStyle, fontSize: 12 });
      const largeMetrics = measureText("Test", { ...defaultFontStyle, fontSize: 18 });

      expect(largeMetrics.width).toBeGreaterThan(smallMetrics.width);
      expect(largeMetrics.height).toBeGreaterThan(smallMetrics.height);
    });
  });

  describe("measureMultilineText", () => {
    it("should handle single line", () => {
      const lines = ["Single line"];
      const metrics = measureMultilineText(lines, defaultFontStyle);
      const singleMetrics = measureText("Single line", defaultFontStyle);

      expect(metrics.width).toBe(singleMetrics.width);
      expect(metrics.height).toBe(singleMetrics.height);
    });

    it("should handle multiple lines", () => {
      const lines = ["Line 1", "Line 2"];
      const metrics = measureMultilineText(lines, defaultFontStyle);
      const line1Metrics = measureText("Line 1", defaultFontStyle);
      const line2Metrics = measureText("Line 2", defaultFontStyle);

      expect(metrics.width).toBe(Math.max(line1Metrics.width, line2Metrics.width));
      expect(metrics.height).toBe(line1Metrics.height + line2Metrics.height);
    });

    it("should handle empty array", () => {
      const metrics = measureMultilineText([], defaultFontStyle);

      expect(metrics.width).toBe(0);
      expect(metrics.height).toBe(0);
      expect(metrics.ascent).toBe(0);
      expect(metrics.descent).toBe(0);
    });
  });

  describe("calculateOptimalCellSize", () => {
    it("should calculate size for text with padding", () => {
      const text = "Test";
      const padding = 8;
      const minWidth = 60;
      const minHeight = 24;
      const size = calculateOptimalCellSize(text, defaultFontStyle, padding, minWidth, minHeight);
      const textMetrics = measureText(text, defaultFontStyle);

      const expectedWidth = Math.max(textMetrics.width + padding * 2, minWidth);
      const expectedHeight = Math.max(textMetrics.height + padding * 2, minHeight);

      expect(size.width).toBe(expectedWidth);
      expect(size.height).toBe(expectedHeight);
    });

    it("should respect minimum dimensions", () => {
      const text = "A";
      const minWidth = 100;
      const minHeight = 50;
      const size = calculateOptimalCellSize(text, defaultFontStyle, 4, minWidth, minHeight);

      expect(size.width).toBeGreaterThanOrEqual(minWidth);
      expect(size.height).toBeGreaterThanOrEqual(minHeight);
    });

    it("should handle empty text", () => {
      const minWidth = 60;
      const minHeight = 24;
      const size = calculateOptimalCellSize("", defaultFontStyle, 4, minWidth, minHeight);

      expect(size.width).toBe(minWidth);
      expect(size.height).toBe(minHeight);
    });

    it("should handle whitespace-only text", () => {
      const minWidth = 60;
      const minHeight = 24;
      const size = calculateOptimalCellSize("   ", defaultFontStyle, 4, minWidth, minHeight);

      expect(size.width).toBe(minWidth);
      expect(size.height).toBe(minHeight);
    });
  });

  describe("measureTextCached", () => {
    it("should cache measurement results", () => {
      const text = "Cache test";

      // First measurement
      const firstMetrics = measureTextCached(text, defaultFontStyle);

      // Second measurement should return cached result
      const secondMetrics = measureTextCached(text, defaultFontStyle);

      expect(firstMetrics).toEqual(secondMetrics);
      expect(firstMetrics.width).toBeGreaterThan(0);
    });

    it("should differentiate cache by font properties", () => {
      const text = "Test";
      const normalMetrics = measureTextCached(text, { ...defaultFontStyle, fontWeight: "normal" });
      const boldMetrics = measureTextCached(text, { ...defaultFontStyle, fontWeight: "bold" });

      expect(normalMetrics.width).not.toBe(boldMetrics.width);
    });
  });

  describe("getAverageCharWidth", () => {
    it("should return reasonable average character width", () => {
      const avgWidth = getAverageCharWidth(defaultFontStyle);

      expect(avgWidth).toBeGreaterThan(0);
      expect(avgWidth).toBeLessThan(defaultFontStyle.fontSize); // Should be less than font size
    });

    it("should vary with font size", () => {
      const smallAvg = getAverageCharWidth({ ...defaultFontStyle, fontSize: 10 });
      const largeAvg = getAverageCharWidth({ ...defaultFontStyle, fontSize: 20 });

      expect(largeAvg).toBeGreaterThan(smallAvg);
    });
  });

  describe("estimateTextWidth", () => {
    it("should estimate width based on character count", () => {
      const shortText = "Hi";
      const longText = "Hello World";

      const shortEstimate = estimateTextWidth(shortText, defaultFontStyle);
      const longEstimate = estimateTextWidth(longText, defaultFontStyle);

      expect(longEstimate).toBeGreaterThan(shortEstimate);
      expect(shortEstimate).toBeGreaterThan(0);
    });

    it("should handle empty text", () => {
      const estimate = estimateTextWidth("", defaultFontStyle);
      expect(estimate).toBe(0);
    });
  });

  describe("cache management", () => {
    it("should clear cache completely", () => {
      // Add some entries to cache
      measureTextCached("Test 1", defaultFontStyle);
      measureTextCached("Test 2", defaultFontStyle);

      clearMeasurementCache();

      // After clearing, should still work but recalculate
      const metrics = measureTextCached("Test 1", defaultFontStyle);
      expect(metrics.width).toBeGreaterThan(0);
    });
  });
});
