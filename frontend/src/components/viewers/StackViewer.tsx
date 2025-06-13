import { useRef, useEffect, useState } from "react";
import { Types } from "@cornerstonejs/core";
import { DicomStackViewerProps } from "@/shared/types";
import { saveStackConfig } from "@/shared/api";
import { useViewportResize } from "@/hooks/useViewportResize";
import { useViewerInitialization } from "@/hooks/useViewerInitialization";
import { useAnnotationUndo } from "@/hooks/useAnnotationUndo";
import { useViewerCleanup } from "@/hooks/useViewerCleanup";
import { getViewportAnnotations } from "@/lib/dicom/config/annotationLoader";
import { setupDicomStackViewer } from "@/lib/dicom/utils/viewerUtils";
import { useViewportControls } from "@/hooks/useViewportControls";
import { handleToolSelection } from "@/lib/dicom/config/dicomAnnotationControl";
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

  // Direct state management
  const [contrast, setContrast] = useState(data.viewer.configs.contrast);
  const [brightness, setBrightness] = useState(data.viewer.configs.brightness);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Viewport controls hook
  const {
    applyWindowLevel,
    applyContrastChange,
    applyBrightnessChange,
    flipViewportVertical,
    flipViewportHorizontal,
    rotateViewportClockwise,
    rotateViewportCounterClockwise,
  } = useViewportControls();

  // Reset active tool when component mounts (switching between viewers)
  useEffect(() => {
    setActiveTool(null);
  }, [viewportId]);

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
      const { renderingEngine, viewport } = await setupDicomStackViewer({
        element,
        renderingEngineId,
        viewportId,
        toolGroupId,
        imageUrls: data.viewer.imageUrl,
        annotations: data.viewer.configs.annotations
      });

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
      setContrast(value);
      applyContrastChange(viewportRef.current, value, brightness);
    }
  };

  const handleBrightnessChangeWrapper = (value: number) => {
    if (viewportRef.current) {
      setBrightness(value);
      applyBrightnessChange(viewportRef.current, value, contrast);
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

  const flipVertical = () => {
    if (viewportRef.current) {
      flipViewportVertical(viewportRef.current);
    }
  };

  const flipHorizontal = () => {
    if (viewportRef.current) {
      flipViewportHorizontal(viewportRef.current);
    }
  };

  const rotateClockwise = () => {
    if (viewportRef.current) {
      rotateViewportClockwise(viewportRef.current);
    }
  };

  const rotateCounterClockwise = () => {
    if (viewportRef.current) {
      rotateViewportCounterClockwise(viewportRef.current);
    }
  };

  const handleToolSelect = (toolName: string) => {
    handleToolSelection(toolName, viewportId, setActiveTool);
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
        handleFlipHorizontal={flipHorizontal}
        handleFlipVertical={flipVertical}
        handleRotateClockwise={rotateClockwise}
        handleRotateCounterClockwise={rotateCounterClockwise}
      />
    </div>
  );
}
