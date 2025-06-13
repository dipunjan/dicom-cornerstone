import { toolConfig } from "@/lib/dicom/config/dicomAnnotationControl";
import {
  FaArrowsAltH,
  FaArrowsAltV,
  FaRedoAlt,
  FaUndoAlt,
  FaSave,
  FaUndo,
  FaAdjust,
  FaSun,
  FaCircleNotch,
  FaPalette,
  FaEye,

  FaSquare
} from "react-icons/fa";

interface ViewerControlsProps {
  contrast?: number;
  brightness?: number;
  activeTool?: string | null;
  handleToolSelect?: (toolName: string) => void;
  handleContrastChange?: (value: number) => void;
  handleBrightnessChange?: (value: number) => void;
  handleSave?: () => void;
  handleUndo?: () => void;
  canUndo?: boolean;
  handleFlipHorizontal?: () => void;
  handleFlipVertical?: () => void;
  handleRotateClockwise?: () => void;
  handleRotateCounterClockwise?: () => void;
  isInverted?: boolean;
  handleInvertToggle?: () => void;
  isGrayscale?: boolean;
  handleGrayscaleToggle?: () => void;
  showGrayscaleToggle?: boolean;
  grayscaleDisabled?: boolean;
  sharpness?: number;
  handleSharpnessChange?: (value: number) => void;
  gammaR?: number;
  gammaG?: number;
  gammaB?: number;
  handleGammaRChange?: (value: number) => void;
  handleGammaGChange?: (value: number) => void;
  handleGammaBChange?: (value: number) => void;
  showImageEnhancement?: boolean;
}

export default function ViewerControls({
  contrast = 0,
  brightness = 0,
  activeTool = null,
  handleToolSelect = () => {},
  handleContrastChange = () => {},
  handleBrightnessChange = () => {},
  handleSave = () => {},
  handleUndo = () => {},
  canUndo = false,
  handleFlipHorizontal = () => {},
  handleFlipVertical = () => {},
  handleRotateClockwise = () => {},
  handleRotateCounterClockwise = () => {},
  isInverted = false,
  handleInvertToggle = () => {},
  isGrayscale = false,
  handleGrayscaleToggle = () => {},
  showGrayscaleToggle = false,
  grayscaleDisabled = false,
  sharpness,
  handleSharpnessChange = () => {},
  gammaR,
  gammaG,
  gammaB,
  handleGammaRChange = () => {},
  handleGammaGChange = () => {},
  handleGammaBChange = () => {},
  showImageEnhancement = false,
}: ViewerControlsProps) {
  return (
    <div className="controls">
      {/* Tools Section */}
      <div className="control-group">
        <div className="tools-grid">
          {toolConfig.map((tool) => {
            const IconComponent = tool.icon;
            const isActive = activeTool === tool.name;
            return (
              <button
                key={tool.name}
                onClick={() => handleToolSelect(tool.name)}
                className={`tool-button ${isActive ? 'tool-button-active' : ''}`}
                title={tool.displayName}
              >
                <IconComponent />
              </button>
            );
          })}
        </div>
      </div>

      {/* Separator */}
      <div className="toolbar-separator"></div>

      {/* Transform Tools */}
      <div className="control-group">
        <div className="tools-grid">
          <button
            onClick={handleFlipHorizontal}
            className="tool-button"
            title="Flip Horizontal"
          >
            <FaArrowsAltH />
          </button>
          <button
            onClick={handleFlipVertical}
            className="tool-button"
            title="Flip Vertical"
          >
            <FaArrowsAltV />
          </button>
          <button
            onClick={handleRotateCounterClockwise}
            className="tool-button"
            title="Rotate Counter-Clockwise"
          >
            <FaUndoAlt />
          </button>
          <button
            onClick={handleRotateClockwise}
            className="tool-button"
            title="Rotate Clockwise"
          >
            <FaRedoAlt />
          </button>
          <button
            onClick={handleInvertToggle}
            className={`tool-button ${isInverted ? 'tool-button-active' : ''}`}
            title={isInverted ? "Disable Invert" : "Enable Invert"}
          >
            <FaCircleNotch />
          </button>
          {showGrayscaleToggle && (
            <button
              onClick={grayscaleDisabled ? undefined : handleGrayscaleToggle}
              className={`tool-button ${isGrayscale ? 'tool-button-active' : ''} ${grayscaleDisabled ? 'tool-button-disabled' : ''}`}
              title={grayscaleDisabled ? "Grayscale not available for DICOM images" : (isGrayscale ? "Disable Grayscale" : "Enable Grayscale")}
              disabled={grayscaleDisabled}
            >
              <FaPalette />
            </button>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="toolbar-separator"></div>

      {/* Image Controls */}
      <div className="control-group">
        <div className="slider-control">
          <FaAdjust className="slider-icon" title="Contrast" />
          <input
            type="range"
            min={-127}
            max={127}
            step={1}
            value={contrast}
            onChange={(e) => handleContrastChange(parseFloat(e.target.value))}
            className="compact-slider"
            title={`Contrast: ${contrast.toFixed(1)}`}
          />
        </div>
        <div className="slider-control">
          <FaSun className="slider-icon" title="Brightness" />
          <input
            type="range"
            min={-127}
            max={127}
            step={1}
            value={brightness}
            onChange={(e) => handleBrightnessChange(parseFloat(e.target.value))}
            className="compact-slider"
            title={`Brightness: ${brightness.toFixed(1)}`}
          />
        </div>
      </div>

      {/* Image Enhancement Controls - Only for ImageViewer */}
      {showImageEnhancement && (
        <>
          {/* Separator */}
          <div className="toolbar-separator"></div>

          <div className="control-group">
            <div className="slider-control">
              <FaEye className="slider-icon" title="Sharpness" />
              <input
                type="range"
                min={0}
                max={200}
                step={5}
                value={sharpness!}
                onChange={(e) => handleSharpnessChange(parseFloat(e.target.value))}
                className="compact-slider"
                title={`Sharpness: ${sharpness!}% (100% = normal)`}
              />
            </div>
            <div className="slider-control">
              <FaSquare className="slider-icon" title="Red Gamma" style={{ color: '#ff4444' }} />
              <input
                type="range"
                min={0.2}
                max={2.5}
                step={0.1}
                value={gammaR!}
                onChange={(e) => handleGammaRChange(parseFloat(e.target.value))}
                className="compact-slider"
                title={`Red Gamma: ${gammaR!.toFixed(1)} (1.0 = normal)`}
              />
            </div>
            <div className="slider-control">
              <FaSquare className="slider-icon" title="Green Gamma" style={{ color: '#44ff44' }} />
              <input
                type="range"
                min={0.2}
                max={2.5}
                step={0.1}
                value={gammaG!}
                onChange={(e) => handleGammaGChange(parseFloat(e.target.value))}
                className="compact-slider"
                title={`Green Gamma: ${gammaG!.toFixed(1)} (1.0 = normal)`}
              />
            </div>
            <div className="slider-control">
              <FaSquare className="slider-icon" title="Blue Gamma" style={{ color: '#4444ff' }} />
              <input
                type="range"
                min={0.2}
                max={2.5}
                step={0.1}
                value={gammaB!}
                onChange={(e) => handleGammaBChange(parseFloat(e.target.value))}
                className="compact-slider"
                title={`Blue Gamma: ${gammaB!.toFixed(1)} (1.0 = normal)`}
              />
            </div>
          </div>
        </>
      )}

      {/* Separator */}
      <div className="toolbar-separator"></div>

      {/* Action Buttons */}
      <div className="control-group">
        <div className="tools-grid">
          <button
            className={`tool-button ${!canUndo ? 'tool-button-disabled' : ''}`}
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo last annotation"
          >
            <FaUndo />
          </button>
          <button
            className="tool-button"
            onClick={handleSave}
            title="Save Settings"
          >
            <FaSave />
          </button>
        </div>
      </div>
    </div>
  );
}
