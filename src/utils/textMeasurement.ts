/**
 * Text measurement utilities for responsive SVG generation
 * Uses Canvas 2D Context for accurate text dimension calculation
 */

export interface TextMetrics {
  width: number;
  height: number;
  ascent: number;
  descent: number;
}

export interface FontStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
}

// Canvas instance for text measurement (reused for performance)
let measurementCanvas: HTMLCanvasElement | null = null;
let measurementContext: CanvasRenderingContext2D | null = null;

/**
 * Initialize measurement canvas (lazy initialization)
 */
const initMeasurementCanvas = (): CanvasRenderingContext2D => {
  measurementCanvas ??= document.createElement('canvas');
  measurementContext ??= measurementCanvas.getContext('2d') ?? createMockCanvasContext();
  
  return measurementContext;
};

/**
 * Create mock canvas context for testing environments
 */
const createMockCanvasContext = (): CanvasRenderingContext2D => {
  const mockContext = {
    font: '',
    measureText: (text: string) => {
      // Simple mock measurement based on character count and font size
      const fontSizeMatch = /(\d+)px/.exec(mockContext.font);
      const fontSize = parseInt(fontSizeMatch?.[1] ?? '14');
      const isBold = mockContext.font.includes('bold');
      const charWidth = fontSize * (isBold ? 0.65 : 0.6); // Bold text is wider
      const width = text.length * charWidth;
      
      return {
        width,
        actualBoundingBoxAscent: fontSize * 0.8,
        actualBoundingBoxDescent: fontSize * 0.2,
      };
    }
  } as CanvasRenderingContext2D;
  
  return mockContext;
};

/**
 * Measure text dimensions accurately using Canvas 2D Context
 * @param text - Text to measure
 * @param fontStyle - Font styling information
 * @returns TextMetrics with width, height, ascent, descent
 */
export const measureText = (text: string, fontStyle: FontStyle): TextMetrics => {
  const context = initMeasurementCanvas();
  
  // Set font style
  const { fontSize, fontFamily, fontWeight } = fontStyle;
  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  
  // Measure text
  const metrics = context.measureText(text);
  
  // Calculate height based on font metrics
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;
  const height = ascent + descent;
  
  return {
    width: metrics.width,
    height,
    ascent,
    descent,
  };
};

/**
 * Measure multiple lines of text
 * @param lines - Array of text lines
 * @param fontStyle - Font styling information
 * @returns Combined metrics for all lines
 */
export const measureMultilineText = (lines: string[], fontStyle: FontStyle): TextMetrics => {
  if (lines.length === 0) {
    return { width: 0, height: 0, ascent: 0, descent: 0 };
  }
  
  let maxWidth = 0;
  let totalHeight = 0;
  let maxAscent = 0;
  let maxDescent = 0;
  
  for (const line of lines) {
    const metrics = measureText(line, fontStyle);
    maxWidth = Math.max(maxWidth, metrics.width);
    totalHeight += metrics.height;
    maxAscent = Math.max(maxAscent, metrics.ascent);
    maxDescent = Math.max(maxDescent, metrics.descent);
  }
  
  return {
    width: maxWidth,
    height: totalHeight,
    ascent: maxAscent,
    descent: maxDescent,
  };
};

/**
 * Calculate optimal cell dimensions for given text content
 * @param text - Cell text content
 * @param fontStyle - Font styling
 * @param padding - Padding around text
 * @param minWidth - Minimum cell width
 * @param minHeight - Minimum cell height
 * @returns Optimal cell dimensions
 */
export const calculateOptimalCellSize = (
  text: string,
  fontStyle: FontStyle,
  padding = 8,
  minWidth = 60,
  minHeight = 24
): { width: number; height: number } => {
  if (!text.trim()) {
    return { width: minWidth, height: minHeight };
  }
  
  // Support for line breaks in the future
  const lines = text.split('\n').filter(line => line.trim());
  const metrics = measureMultilineText(lines, fontStyle);
  
  // Add padding and ensure minimum sizes
  const width = Math.max(metrics.width + padding * 2, minWidth);
  const height = Math.max(metrics.height + padding * 2, minHeight);
  
  return { width, height };
};

/**
 * Cache for text measurement results to improve performance
 */
const measurementCache = new Map<string, TextMetrics>();

/**
 * Generate cache key for text measurement
 */
const getCacheKey = (text: string, fontStyle: FontStyle): string => {
  return `${text}|${fontStyle.fontSize}|${fontStyle.fontFamily}|${fontStyle.fontWeight}`;
};

/**
 * Measure text with caching for improved performance
 * @param text - Text to measure
 * @param fontStyle - Font styling information
 * @returns Cached or newly calculated TextMetrics
 */
export const measureTextCached = (text: string, fontStyle: FontStyle): TextMetrics => {
  const cacheKey = getCacheKey(text, fontStyle);
  
  if (measurementCache.has(cacheKey)) {
    const cached = measurementCache.get(cacheKey);
    if (!cached) {
      throw new Error(`Measurement cache miss for key: ${cacheKey}`);
    }
    return cached;
  }
  
  const metrics = measureText(text, fontStyle);
  measurementCache.set(cacheKey, metrics);
  
  // Limit cache size to prevent memory issues
  if (measurementCache.size > 1000) {
    // Remove oldest entries (simple LRU approximation)
    const firstKey = measurementCache.keys().next().value;
    if (firstKey) {
      measurementCache.delete(firstKey);
    }
  }
  
  return metrics;
};

/**
 * Clear measurement cache (useful for testing or memory management)
 */
export const clearMeasurementCache = (): void => {
  measurementCache.clear();
};

/**
 * Get approximate character width for quick estimates
 * @param fontStyle - Font styling
 * @returns Average character width
 */
export const getAverageCharWidth = (fontStyle: FontStyle): number => {
  // Use a sample of common characters to estimate average width
  const sampleText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const cacheKey = getCacheKey(sampleText, fontStyle);
  
  if (measurementCache.has(cacheKey)) {
    const metrics = measurementCache.get(cacheKey);
    if (!metrics) {
      throw new Error(`Font cache miss for key: ${cacheKey}`);
    }
    return metrics.width / sampleText.length;
  }
  
  const metrics = measureText(sampleText, fontStyle);
  measurementCache.set(cacheKey, metrics);
  return metrics.width / sampleText.length;
};

/**
 * Estimate text width without full measurement (for performance)
 * @param text - Text to estimate
 * @param fontStyle - Font styling
 * @returns Estimated width
 */
export const estimateTextWidth = (text: string, fontStyle: FontStyle): number => {
  const avgCharWidth = getAverageCharWidth(fontStyle);
  return text.length * avgCharWidth;
};