import { toolConfig } from "@/lib/dicom/config/dicomAnnotationControl";
import {
  FaArrowsAltH,
  FaArrowsAltV,
  FaRedoAlt,
  FaUndoAlt,
  FaSave,
  FaUndo,
  FaAdjust,
  FaSun
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
