import { toolConfig } from "@/lib/dicom/config/dicomAnnotationControl";

interface ViewerControlsProps {
  contrast?: number;
  brightness?: number;
  handleToolSelect?: (toolName: string) => void;
  handleContrastChange?: (value: number) => void;
  handleBrightnessChange?: (value: number) => void;
  handleSave?: () => void;
  handleUndo?: () => void;
  canUndo?: boolean;
}

export default function ViewerControls({
  contrast = 0,
  brightness = 0,
  handleToolSelect = () => {},
  handleContrastChange = () => {},
  handleBrightnessChange = () => {},
  handleSave = () => {},
  handleUndo = () => {},
  canUndo = false,
}: ViewerControlsProps) {
  return (
    <div className="controls">
      <div className="control-group">
        <label>Tools:</label>
        <div className="tools-grid">
          {toolConfig.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <button
                key={tool.name}
                onClick={() => handleToolSelect(tool.name)}
                className="tool-button"
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
