import { useState, useCallback } from "react";
import { Types } from "@cornerstonejs/core";
import { ToolGroupManager } from "@cornerstonejs/tools";
import { adjustVolumeShift } from "@/lib/dicom/config/dicomImageControls";
import { setupVolumeViewer3D, setupVolumeViewer2D, ViewerSetupResult } from "@/lib/dicom/utils/viewerUtils";

interface UseVolumeControlsProps {
  initialShift: number;
  renderingEngineId: string;
  viewportId: string;
  toolGroupId: string;
  dataId: string;
}

export function useVolumeControls({
  initialShift,
  renderingEngineId,
  viewportId,
  toolGroupId,
  dataId
}: UseVolumeControlsProps) {
  const [shift, setShift] = useState(initialShift);
  const [is3D, setIs3D] = useState(true);

  const handleShiftChange = (value: number, viewport: Types.IVolumeViewport | null) => {
    if (!viewport || !is3D) return;
    setShift(value);
    adjustVolumeShift(viewport, value);
  };

  const switchTo3D = useCallback(async (
    element: HTMLDivElement | null,
    renderingEngine: Types.IRenderingEngine | null,
    imageUrls: string[],
  ): Promise<ViewerSetupResult | null> => {
    if (!element || !renderingEngine) return null;

    ToolGroupManager.destroyToolGroup(toolGroupId);

    const result = await setupVolumeViewer3D(
      element,
      renderingEngineId,
      viewportId,
      toolGroupId,
      imageUrls,
      `dicomVolume_${dataId}`
    );

    setIs3D(true);
    return result;
  }, [renderingEngineId, toolGroupId, viewportId, dataId]);

  const switchTo2D = useCallback(async (
    element: HTMLDivElement | null,
    renderingEngine: Types.IRenderingEngine | null,
    imageUrls: string[],
  ): Promise<ViewerSetupResult | null> => {
    if (!element || !renderingEngine) return null;

    ToolGroupManager.destroyToolGroup(toolGroupId);

    const result = await setupVolumeViewer2D(
      element,
      renderingEngineId,
      viewportId,
      toolGroupId,
      imageUrls
    );

    setIs3D(false);
    return result;
  }, [renderingEngineId, toolGroupId, viewportId]);

  return {
    shift,
    is3D,
    handleShiftChange,
    switchTo3D,
    switchTo2D,
    setIs3D
  };
}
