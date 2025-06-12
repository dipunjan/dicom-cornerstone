import { useState, useEffect } from "react";
import { Types } from "@cornerstonejs/core";
import { applyWindowLevel } from "@/lib/dicom/config/dicomImageControls";
import { setPrimaryTool, resetToolsToDefault } from "@/lib/dicom/config/dicomAnnotationControl";

interface UseViewerControlsProps {
  initialContrast: number;
  initialBrightness: number;
  viewportId: string;
}

export function useViewerControls({
  initialContrast,
  initialBrightness,
  viewportId
}: UseViewerControlsProps) {
  const [contrast, setContrast] = useState(initialContrast);
  const [brightness, setBrightness] = useState(initialBrightness);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Reset active tool when component mounts (switching between viewers)
  useEffect(() => {
    setActiveTool(null);
    // Reset tools in Cornerstone as well
    const timeoutId = setTimeout(() => {
      resetToolsToDefault(viewportId);
    }, 100); // Small delay to ensure viewport is ready

    return () => clearTimeout(timeoutId);
  }, [viewportId]);

  const handleContrastChange = (value: number, viewport: Types.IStackViewport | Types.IVolumeViewport) => {
    if (!viewport || !('setProperties' in viewport)) return;
    setContrast(value);
    applyWindowLevel(viewport as Types.IStackViewport, value, brightness);
  };

  const handleBrightnessChange = (value: number, viewport: Types.IStackViewport | Types.IVolumeViewport) => {
    if (!viewport || !('setProperties' in viewport)) return;
    setBrightness(value);
    applyWindowLevel(viewport as Types.IStackViewport, contrast, value);
  };

  const handleToolSelect = (toolName: string) => {
    setPrimaryTool(toolName, viewportId);
    setActiveTool(toolName);
  };

  return {
    contrast,
    brightness,
    activeTool,
    handleContrastChange,
    handleBrightnessChange,
    handleToolSelect
  };
}
