import { toolConfig } from "@/lib/dicom/config/dicomAnnotationControl";
import { FaArrowsAltH, FaArrowsAltV, FaRedoAlt, FaUndoAlt } from "react-icons/fa";

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
      <div className="control-group">
        <label>Tools:</label>
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
                {tool.displayName}
              </button>
            );
          })}
        </div>
      </div>

      <div className="control-group">
        <label>Flip:</label>
        <div className="tools-grid">
          <button
            onClick={handleFlipHorizontal}
            className="tool-button"
            title="Flip Horizontal"
          >
            <FaArrowsAltH />
            Flip H
          </button>
          <button
            onClick={handleFlipVertical}
            className="tool-button"
            title="Flip Vertical"
          >
            <FaArrowsAltV />
            Flip V
          </button>
        </div>
      </div>

      <div className="control-group">
        <label>Rotate:</label>
        <div className="tools-grid">
          <button
            onClick={handleRotateCounterClockwise}
            className="tool-button"
            title="Rotate Counter-Clockwise"
          >
            <FaUndoAlt />
            Rotate CCW
          </button>
          <button
            onClick={handleRotateClockwise}
            className="tool-button"
            title="Rotate Clockwise"
          >
            <FaRedoAlt />
            Rotate CW
          </button>
        </div>
      </div>

      <div className="control-group">
        <label>Contrast:</label>
        <input
          type="range"
          min={-127}
          max={127}
          step={1}
          value={contrast}
          onChange={(e) => handleContrastChange(parseFloat(e.target.value))}
        />
        <span>{contrast.toFixed(1)}</span>
      </div>

      <div className="control-group">
        <label>Brightness:</label>
        <input
          type="range"
          min={-127}
          max={127}
          step={1}
          value={brightness}
          onChange={(e) => handleBrightnessChange(parseFloat(e.target.value))}
        />
        <span>{brightness.toFixed(1)}</span>
      </div>

      <div className="control-group">
        <button
          className="undo-button"
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo last annotation"
        >
          Undo
        </button>
        <button className="save-button" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
