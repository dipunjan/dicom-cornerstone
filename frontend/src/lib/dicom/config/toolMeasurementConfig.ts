/**
 * Tool Measurement Configuration
 * Only Length tool shows measurements, all others have measurements disabled for performance
 */

export interface CornerstoneToolConfig {
  calculateStats?: boolean;
  renderTextBox?: boolean;
  calculateCachedStats?: boolean;
  calculateStatsOnDrag?: boolean;
  calculateStatsOnEnd?: boolean;
  throttleTime?: number;
  debounceTime?: number;
}

/**
 * Configuration for Length Tool - shows measurements
 */
export const LENGTH_TOOL_CONFIG = {
  calculateStats: true,
  renderTextBox: true,
  calculateCachedStats: true,
  calculateStatsOnDrag: false,
  calculateStatsOnEnd: true,
  throttleTime: 100,
  debounceTime: 200,
};

/**
 * Configuration for ROI Tools - no measurements
 */
export const ROI_TOOL_CONFIG = {
  calculateStats: false,
  renderTextBox: false,
  calculateCachedStats: false,
  calculateStatsOnDrag: false,
  calculateStatsOnEnd: false,
  throttleTime: 16,
  debounceTime: 0,
};

/**
 * Configuration for Annotation Tools - no measurements
 */
export const ANNOTATION_TOOL_CONFIG = {
  calculateStats: false,
  renderTextBox: false,
  calculateCachedStats: false,
  calculateStatsOnDrag: false,
  calculateStatsOnEnd: false,
  throttleTime: 16,
  debounceTime: 0,
};

/**
 * Configuration for EllipticalROI tool - no measurements
 * Working configuration that completely disables text boxes
 */
export const ELLIPTICAL_ROI_CONFIG = {
  getTextLines: () => [],
  createTextBoxContent: () => null,
  renderTextBox: false,
  showTextBox: false,
  calculateStats: false,
  textBoxVisibility: false,
  displayTextBox: false,
  hideTextBox: true,
  textBox: false,
  calculateCachedStats: false,
  calculateStatsOnDrag: false,
  calculateStatsOnEnd: false,
  throttleTime: 16,
  debounceTime: 0,
};

/**
 * Tool-specific configurations
 */
export const TOOL_CONFIGS = {
  'Length': LENGTH_TOOL_CONFIG,
  'EllipticalROI': ELLIPTICAL_ROI_CONFIG,
  'RectangleROI': ROI_TOOL_CONFIG,
  'PlanarFreehandROI': ROI_TOOL_CONFIG,
  'Angle': ANNOTATION_TOOL_CONFIG,
  'Bidirectional': ANNOTATION_TOOL_CONFIG,
  'ArrowAnnotate': ANNOTATION_TOOL_CONFIG,
  'Zoom': ANNOTATION_TOOL_CONFIG,
  'Pan': ANNOTATION_TOOL_CONFIG,
  'StackScroll': ANNOTATION_TOOL_CONFIG,
  'TrackballRotate': ANNOTATION_TOOL_CONFIG,
  'WindowLevel': ANNOTATION_TOOL_CONFIG,
  'Magnify': ANNOTATION_TOOL_CONFIG,
  'OrientationMarker': ANNOTATION_TOOL_CONFIG,
};

/**
 * Apply measurement configuration to a tool
 */
export function applyMeasurementConfig(toolName: string, baseConfig: any = {}): CornerstoneToolConfig {
  const config = TOOL_CONFIGS[toolName as keyof typeof TOOL_CONFIGS] || ANNOTATION_TOOL_CONFIG;
  return { ...baseConfig, ...config };
}
