import { useRef, useEffect } from "react";
import { Types } from "@cornerstonejs/core";
import { DicomStackViewerProps } from "@/shared/types";
import { saveStackConfig } from "@/shared/api";
import { useViewportResize } from "@/hooks/useViewportResize";
import { useViewerInitialization } from "@/hooks/useViewerInitialization";
import { useViewerControls } from "@/hooks/useViewerControls";
import { useAnnotationUndo } from "@/hooks/useAnnotationUndo";
import { useViewerCleanup } from "@/hooks/useViewerCleanup";
import { getViewportAnnotations } from "@/lib/dicom/config/annotationLoader";
import { setupStackViewer } from "@/lib/dicom/utils/viewerUtils";
import { applyWindowLevel } from "@/lib/dicom/config/dicomImageControls";
import ViewerControls from "../toolbar/ViewerControls";

export default function StackViewer({ data }: DicomStackViewerProps) {
  const renderingEngineId = `renderingEngine_${data.id}`;
  const viewportId = `viewport_${data.id}`;
  const toolGroupId = `toolGroup_${data.id}`;

  const elementRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<Types.IStackViewport | Types.IVolumeViewport | null>(null);
  const renderingEngineRef = useRef<Types.IRenderingEngine | null>(null);
  const dicomFileRef = useRef<string>("");

  const { isInitialized } = useViewerInitialization({
    needsWebImageLoader: false
  });

  const {
    contrast,
    brightness,
    activeTool,
    handleContrastChange,
    handleBrightnessChange,
    handleToolSelect
  } = useViewerControls({
    initialContrast: data.viewer.configs.contrast,
    initialBrightness: data.viewer.configs.brightness,
    viewportId
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

  useViewportResize(renderingEngineRef, viewportId, isInitialized);

  useEffect(() => {
    if (!isInitialized || !elementRef.current) return;

    const initializeViewer = async () => {
      const element = elementRef.current;
      if (!element) return;
      const { renderingEngine, viewport } = await setupStackViewer(
        element,
        renderingEngineId,
        viewportId,
        toolGroupId,
        data.viewer.imageUrl,
        data.viewer.configs.annotations
      );

      renderingEngineRef.current = renderingEngine;
      viewportRef.current = viewport;
      dicomFileRef.current = data.viewer.imageUrl;

      // Apply initial contrast and brightness
      applyWindowLevel(viewport as Types.IStackViewport, data.viewer.configs.contrast, data.viewer.configs.brightness);
    };

    initializeViewer();
  }, [isInitialized, data, renderingEngineId, viewportId, toolGroupId]);

  const handleUndoClick = () => {
    undo(viewportRef.current);
  };

  const handleContrastChangeWrapper = (value: number) => {
    if (viewportRef.current) {
      handleContrastChange(value, viewportRef.current);
    }
  };

  const handleBrightnessChangeWrapper = (value: number) => {
    if (viewportRef.current) {
      handleBrightnessChange(value, viewportRef.current);
    }
  };

  const handleSave = async () => {
    const annotations = getViewportAnnotations(viewportId);
    await saveStackConfig(data.id, {
      contrast,
      brightness,
      annotations,
    });

    updateSavedAnnotations(annotations);
  };
  return (
    <div className="stack-viewer">
      <div
        ref={elementRef}
        data-viewport-uid={viewportId}
        style={{ width: "100%", height: "100%" }}
      />

      <ViewerControls
        contrast={contrast}
        brightness={brightness}
        activeTool={activeTool}
        handleToolSelect={handleToolSelect}
        handleContrastChange={handleContrastChangeWrapper}
        handleBrightnessChange={handleBrightnessChangeWrapper}
        handleSave={handleSave}
        handleUndo={handleUndoClick}
        canUndo={canUndo}
      />
    </div>
  );
}
