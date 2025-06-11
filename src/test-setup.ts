import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock Canvas API for JSDOM environment
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(globalThis as any).HTMLCanvasElement.prototype.getContext = vi.fn(() => {
  let currentFont = '';
  
  return {
    get font() {
      return currentFont;
    },
    set font(value: string) {
      currentFont = value;
    },
    measureText: (text: string) => {
      // Parse font size and weight from font string
      const fontSizeMatch = /(\d+)px/.exec(currentFont);
      const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1]) : 14;
      const isBold = currentFont.includes('bold');
      
      // Realistic character width calculation
      const baseCharWidth = fontSize * 0.6;
      const charWidth = isBold ? baseCharWidth * 1.1 : baseCharWidth;
      const width = text.length * charWidth;
      
      return {
        width,
        actualBoundingBoxAscent: fontSize * 0.8,
        actualBoundingBoxDescent: fontSize * 0.2,
        fontBoundingBoxAscent: fontSize * 0.9,
        fontBoundingBoxDescent: fontSize * 0.3,
      };
    },
  };
});
