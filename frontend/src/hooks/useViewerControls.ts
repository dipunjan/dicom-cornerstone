import { useState } from "react";
import { Types } from "@cornerstonejs/core";
import { applyWindowLevel } from "@/lib/dicom/config/dicomImageControls";
import { setPrimaryTool } from "@/lib/dicom/config/dicomAnnotationControl";

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
  };

  return {
    contrast,
    brightness,
    handleContrastChange,
    handleBrightnessChange,
    handleToolSelect
  };
}
