import { useRef, useEffect, useState, useCallback } from "react";
import { Types, cache } from "@cornerstonejs/core";
import { ToolGroupManager } from "@cornerstonejs/tools";
import { initializeCornerstone } from "@/lib/dicom/core/dicomCornerstoneInit";
import {
  createRenderingEngine,
  setup3dViewport,
  setup2dViewport,
  loadDicomVolume,
  loadDicomStack,
} from "@/lib/dicom/core/dicomRenderingEngine";
import { adjustVolumeShift } from "@/lib/dicom/config/dicomImageControls";
import {
  setupViewer,
  volumeViewerConfig,
  volume2dModeConfig,
} from "@/lib/dicom/config/dicomAnnotationControl";
import { saveVolumeConfig } from "@/shared/api";
import { DicomVolumeViewerProps } from "@/shared/types";
import { useViewportResize } from "@/hooks/useViewportResize";

export default function VolumeViewer({ data }: DicomVolumeViewerProps) {
  // Generate unique IDs for this viewer instance
  const renderingEngineId = `renderingEngine_${data.id}`;
  const viewportId = `viewport_${data.id}`;
  const toolGroupId = `toolGroup_${data.id}`;

  const elementRef = useRef<HTMLDivElement>(null);
  const renderingEngineRef = useRef<Types.IRenderingEngine | null>(null);
  const viewportRef = useRef<Types.IStackViewport | Types.IVolumeViewport | null>(null);
  const dicomFilesRef = useRef<string[]>([]);

  const [isInitialized, setIsInitialized] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const [shift, setShift] = useState(data.viewer.configs.shift);

  const handleShiftChange = (value: number) => {
    if (!viewportRef.current || !is3D) return;
    setShift(value);
    adjustVolumeShift(viewportRef.current as Types.IVolumeViewport, value);
  };

  const handleSave = async () => {
    await saveVolumeConfig(data.id, { shift });
  };

  const switchTo3D = useCallback(async () => {
    if (!elementRef.current || !renderingEngineRef.current) return;

    ToolGroupManager.destroyToolGroup(toolGroupId);

    const viewport = setup3dViewport(renderingEngineRef.current, elementRef.current, viewportId);
    viewportRef.current = viewport;

    setupViewer(toolGroupId, viewportId, renderingEngineId, volumeViewerConfig);

    await loadDicomVolume(viewport, dicomFilesRef.current, undefined, `dicomVolume_${data.id}`);
    adjustVolumeShift(viewport, shift);
    setIs3D(true);
  }, [shift, renderingEngineId, toolGroupId, viewportId, data.id]);

  const switchTo2D = useCallback(async () => {
    if (!elementRef.current || !renderingEngineRef.current) return;

    ToolGroupManager.destroyToolGroup(toolGroupId);

    const viewport = setup2dViewport(renderingEngineRef.current, elementRef.current, viewportId);
    viewportRef.current = viewport;

    setupViewer(toolGroupId, viewportId, renderingEngineId, volume2dModeConfig);

    await loadDicomStack(viewport, dicomFilesRef.current);
    setIs3D(false);
  }, [renderingEngineId, toolGroupId, viewportId]);

  useEffect(() => {
    initializeCornerstone();
    setIsInitialized(true);

    return () => {
      ToolGroupManager.destroyToolGroup(toolGroupId);
      renderingEngineRef.current?.destroy();
      cache.purgeCache();
    };
  }, [toolGroupId]);
  useViewportResize(renderingEngineRef, viewportId, isInitialized);

  useEffect(() => {
    if (!isInitialized || !elementRef.current) return;

    const initializeViewer = async () => {
      cache.purgeCache();

      const renderingEngine = createRenderingEngine(renderingEngineId);
      renderingEngineRef.current = renderingEngine;

      const element = elementRef.current;
      if (!element) return;

      const viewport = setup3dViewport(renderingEngine, element, viewportId);
      viewportRef.current = viewport;

      setupViewer(toolGroupId, viewportId, renderingEngineId, volumeViewerConfig);

      dicomFilesRef.current = data.viewer.imageUrl;
      await loadDicomVolume(viewport, data.viewer.imageUrl, undefined, `dicomVolume_${data.id}`);
      setIs3D(true);
      adjustVolumeShift(viewport, shift);
    };

    initializeViewer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, data]);

  return (
    <div className="volume-viewer">
      <div ref={elementRef} style={{ width: "100%", height: "100%" }} />

      {is3D && (
        <div className="controls">
          <div className="control-group">
            <label>Shift:</label>
            <input
              type="range"
              min="0"
              max="3000"
              step="100"
              value={shift}
              onChange={(e) => handleShiftChange(parseInt(e.target.value))}
            />
            <span>{shift}</span>
          </div>

          <button className="save-button" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      )}

      <div className="mode-switcher">
        <span className={`mode-switcher-item ${is3D ? "active" : "inactive"}`} onClick={switchTo3D}>
          3D
        </span>
        <span className="mode-switcher-separator">|</span>
        <span
          className={`mode-switcher-item ${!is3D ? "active" : "inactive"}`}
          onClick={switchTo2D}
        >
          2D
        </span>
      </div>
    </div>
  );
}
