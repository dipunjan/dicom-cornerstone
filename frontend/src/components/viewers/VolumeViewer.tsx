import { useRef, useEffect } from "react";
import { Types } from "@cornerstonejs/core";
import { ToolGroupManager } from "@cornerstonejs/tools";
import { DicomVolumeViewerProps } from "@/shared/types";
import { saveVolumeConfig } from "@/shared/api";
import { useViewportResize } from "@/hooks/useViewportResize";
import { useViewerInitialization } from "@/hooks/useViewerInitialization";
import { useAnnotationUndo } from "@/hooks/useAnnotationUndo";
import { useViewerCleanup } from "@/hooks/useViewerCleanup";
import { getViewportAnnotations } from "@/lib/dicom/config/annotationLoader";
import { setupVolumeViewer3D } from "@/lib/dicom/utils/viewerUtils";
import { useViewportControls } from "@/hooks/useViewportControls";
import {
  setup3dViewport,
  setup2dViewport,
  loadDicomVolume,
  loadDicomStack,
} from "@/lib/dicom/core/dicomRenderingEngine";
import {
  setupViewer,
  volumeViewerConfig,
  volume2dModeConfig,
} from "@/lib/dicom/config/dicomAnnotationControl";

export default function VolumeViewer({ data }: DicomVolumeViewerProps) {
  const renderingEngineId = `renderingEngine_${data.id}`;
  const viewportId = `viewport_${data.id}`;
  const toolGroupId = `toolGroup_${data.id}`;

  const elementRef = useRef<HTMLDivElement>(null);
  const renderingEngineRef = useRef<Types.IRenderingEngine | null>(null);
  const viewportRef = useRef<Types.IStackViewport | Types.IVolumeViewport | null>(null);
  const dicomFilesRef = useRef<string[]>([]);

  const { isInitialized } = useViewerInitialization({
    needsWebImageLoader: false
  });

  // Consolidated viewport controls hook with volume functionality
  const {
    shift,
    is3D,
    handleShiftChange,
    setIs3D,
    adjustVolumeShift
  } = useViewportControls({
    initialShift: data.viewer.configs.shift,
    renderingEngineId,
    viewportId,
    toolGroupId,
    dataId: data.id
  });

  const { canUndo, undo, updateSavedAnnotations } = useAnnotationUndo({
    viewportId,
    isInitialized,
    savedAnnotations: data.viewer.configs.annotations
  });

  useViewerCleanup({
    renderingEngineRef,
    toolGroupId
  });

  const handleShiftChangeWrapper = (value: number) => {
    if (handleShiftChange) {
      handleShiftChange(value, viewportRef.current as Types.IVolumeViewport);
    }
  };

  const handleSave = async () => {
    const annotations = getViewportAnnotations(viewportId);
    await saveVolumeConfig(data.id, {
      shift: shift || 0,
      annotations
    });
    updateSavedAnnotations(annotations);
  };

  const handleUndo = () => {
    undo(viewportRef.current);
  };

  const handleSwitchTo3D = async () => {
    if (!elementRef.current || !renderingEngineRef.current) return;

    ToolGroupManager.destroyToolGroup(toolGroupId);

    const viewport = setup3dViewport(renderingEngineRef.current, elementRef.current, viewportId);
    viewportRef.current = viewport;

    setupViewer(toolGroupId, viewportId, renderingEngineId, volumeViewerConfig);

    await loadDicomVolume(viewport, dicomFilesRef.current, undefined, `dicomVolume_${data.id}`);
    if (adjustVolumeShift && shift !== undefined) {
      adjustVolumeShift(viewport, shift);
    }
    if (setIs3D) {
      setIs3D(true);
    }
  };

  const handleSwitchTo2D = async () => {
    if (!elementRef.current || !renderingEngineRef.current) return;

    ToolGroupManager.destroyToolGroup(toolGroupId);

    const viewport = setup2dViewport(renderingEngineRef.current, elementRef.current, viewportId);
    viewportRef.current = viewport;

    setupViewer(toolGroupId, viewportId, renderingEngineId, volume2dModeConfig);

    await loadDicomStack(viewport, dicomFilesRef.current);
    if (setIs3D) {
      setIs3D(false);
    }
  };

  useViewportResize(renderingEngineRef, viewportId, isInitialized);

  useEffect(() => {
    if (!isInitialized || !elementRef.current) return;

    const initializeViewer = async () => {
      const element = elementRef.current;
      if (!element) return;

      const { renderingEngine, viewport } = await setupVolumeViewer3D(
        element,
        renderingEngineId,
        viewportId,
        toolGroupId,
        data.viewer.imageUrl,
        `dicomVolume_${data.id}`
      );

      renderingEngineRef.current = renderingEngine;
      viewportRef.current = viewport;
      dicomFilesRef.current = data.viewer.imageUrl;

      // Apply initial shift
      adjustVolumeShift(viewport as Types.IVolumeViewport, data.viewer.configs.shift);
    };

    initializeViewer();
  }, [isInitialized, data, renderingEngineId, viewportId, toolGroupId]);

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
              onChange={(e) => handleShiftChangeWrapper(parseInt(e.target.value))}
            />
            <span>{shift}</span>
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
      )}

      <div className="mode-switcher">
        <span className={`mode-switcher-item ${is3D ? "active" : "inactive"}`} onClick={handleSwitchTo3D}>
          3D
        </span>
        <span className="mode-switcher-separator">|</span>
        <span
          className={`mode-switcher-item ${!is3D ? "active" : "inactive"}`}
          onClick={handleSwitchTo2D}
        >
          2D
        </span>
      </div>
    </div>
  );
}
