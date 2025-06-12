import { useRef, useEffect, useState } from "react";
import { Types, cache, setUseCPURendering, eventTarget } from "@cornerstonejs/core";
import { annotation, ToolGroupManager, Enums } from "@cornerstonejs/tools";
import { initializeCornerstone } from "@/lib/dicom/core/dicomCornerstoneInit";
import { registerWebImageLoader } from "@/lib/dicom/core/registerWebImageLoader";
import { createRenderingEngine, setup2dViewport } from "@/lib/dicom/core/dicomRenderingEngine";
import { MedicalImageViewerProps } from "@/shared/types";
import ViewerControls from "../toolbar/ViewerControls";
import { applyWindowLevel } from "@/lib/dicom/config/dicomImageControls";
import { saveImageConfig } from "@/shared/api";
import {
  setupViewer,
  stackViewerConfig,
  setPrimaryTool,
} from "@/lib/dicom/config/dicomAnnotationControl";
import { useViewportResize } from "@/hooks/useViewportResize";
import {
  getViewportAnnotations,
  restoreViewportAnnotations,
} from "@/lib/dicom/config/annotationLoader";

export default function ImageViewer({ data }: MedicalImageViewerProps) {
  // Generate unique IDs for this viewer instance
  const renderingEngineId = `renderingEngine_${data.id}`;
  const viewportId = `viewport_${data.id}`;
  const toolGroupId = `toolGroup_${data.id}`;
  const elementRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<Types.IStackViewport | null>(null);
  const renderingEngineRef = useRef<Types.IRenderingEngine | null>(null);
  const annotationHistoryRef = useRef<any[]>([]);
  const savedAnnotationsRef = useRef<any[]>([]);

  const [isInitialized, setIsInitialized] = useState(false);
  const [contrast, setContrast] = useState(data.viewer.configs.contrast);
  const [brightness, setBrightness] = useState(data.viewer.configs.brightness);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    initializeCornerstone();
    registerWebImageLoader();
    setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => {
      annotation.state.removeAllAnnotations();
      ToolGroupManager.destroyToolGroup(toolGroupId);
      renderingEngineRef.current?.destroy();
      cache.purgeCache();
    };
  }, [toolGroupId]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const initializeViewer = async () => {
      const element = elementRef.current;
      if (!element) return;
      cache.purgeCache();
      const renderingEngine = createRenderingEngine(renderingEngineId);
      renderingEngineRef.current = renderingEngine;
      const viewport = setup2dViewport(renderingEngine, element, viewportId);
      viewportRef.current = viewport;
      setupViewer(toolGroupId, viewportId, renderingEngineId, stackViewerConfig);

      const imageUrl = data.viewer.imageUrl;
      const webImageId = `web:${imageUrl}`;

      await viewport.setStack([webImageId]);
      applyWindowLevel(viewport, contrast, brightness);

      if (data.viewer.configs.annotations) {
        restoreViewportAnnotations(data.viewer.configs.annotations, viewportId, viewport);
        // Store saved annotation UIDs to exclude them from undo history
        savedAnnotationsRef.current = data.viewer.configs.annotations.map((ann: any) => ({
          annotationUID: ann.annotationUID
        }));
      }
    };

    initializeViewer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, data]);

  useViewportResize(renderingEngineRef, viewportId, isInitialized);

  // Set up annotation event listeners for undo functionality
  useEffect(() => {
    if (!isInitialized) return;

    const handleAnnotationAdded = (event: any) => {
      const annotationData = event.detail.annotation;
      const eventViewportId = event.detail.viewportId;

      if (annotationData && eventViewportId === viewportId) {
        const isSavedAnnotation = savedAnnotationsRef.current.some(saved =>
          saved.annotationUID === annotationData.annotationUID
        );

        if (!isSavedAnnotation) {
          annotationHistoryRef.current.push(annotationData.annotationUID);
          setCanUndo(true);
        }
      }
    };

    // Add event listener for annotation added events
    eventTarget.addEventListener(Enums.Events.ANNOTATION_ADDED, handleAnnotationAdded);

    return () => {
      eventTarget.removeEventListener(Enums.Events.ANNOTATION_ADDED, handleAnnotationAdded);
    };
  }, [isInitialized, viewportId]);

  const handleToolSelect = (toolName: string) => {
    setPrimaryTool(toolName, viewportId);
  };

  const handleUndo = () => {
    if (annotationHistoryRef.current.length === 0 || !viewportRef.current) return;

    // Get the last annotation UID from history
    const lastAnnotationUID = annotationHistoryRef.current.pop();

    if (lastAnnotationUID) {
      annotation.state.removeAnnotation(lastAnnotationUID);
      viewportRef.current.render();
      setCanUndo(annotationHistoryRef.current.length > 0);
    }
  };

  const handleContrastChange = (value: number) => {
    if (!viewportRef.current) return;
    setContrast(value);
    applyWindowLevel(viewportRef.current, value, brightness);
  };
  const handleBrightnessChange = (value: number) => {
    if (!viewportRef.current) return;
    setBrightness(value);
    applyWindowLevel(viewportRef.current, contrast, value);
  };

  const handleSave = async () => {
    const annotations = getViewportAnnotations(viewportId);
    await saveImageConfig(data.id, {
      contrast,
      brightness,
      annotations,
    });

    // Update saved annotations to include newly saved ones
    savedAnnotationsRef.current = annotations.map((ann: any) => ({
      annotationUID: ann.annotationUID
    }));

    // Clear undo history since everything is now saved
    annotationHistoryRef.current = [];
    setCanUndo(false);
  };

  return (
    <div className="image-viewer">
      <div
        ref={elementRef}
        data-viewport-uid={viewportId}
        style={{ width: "100%", height: "100%" }}
      />
      <ViewerControls
        contrast={contrast}
        brightness={brightness}
        handleToolSelect={handleToolSelect}
        handleContrastChange={handleContrastChange}
        handleBrightnessChange={handleBrightnessChange}
        handleSave={handleSave}
        handleUndo={handleUndo}
        canUndo={canUndo}
      />
    </div>
  );
}
