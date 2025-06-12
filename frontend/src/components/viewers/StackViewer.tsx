import { useRef, useEffect, useState } from "react";
import { Types, cache, eventTarget } from "@cornerstonejs/core";
import { ToolGroupManager, annotation, Enums } from "@cornerstonejs/tools";
import { initializeCornerstone } from "@/lib/dicom/core/dicomCornerstoneInit";
import {
  createRenderingEngine,
  setup2dViewport,
  loadDicomStack,
} from "@/lib/dicom/core/dicomRenderingEngine";
import { applyWindowLevel } from "@/lib/dicom/config/dicomImageControls";
import {
  setupViewer,
  stackViewerConfig,
  setPrimaryTool,
} from "@/lib/dicom/config/dicomAnnotationControl";
import {
  getViewportAnnotations,
  restoreViewportAnnotations,
} from "@/lib/dicom/config/annotationLoader";
import { saveStackConfig } from "@/shared/api";
import { DicomStackViewerProps } from "@/shared/types";
import ViewerControls from "../toolbar/ViewerControls";
import { useViewportResize } from "@/hooks/useViewportResize";

export default function StackViewer({ data }: DicomStackViewerProps) {
  const renderingEngineId = `renderingEngine_${data.id}`;
  const viewportId = `viewport_${data.id}`;
  const toolGroupId = `toolGroup_${data.id}`;
  const elementRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<Types.IStackViewport | null>(null);
  const renderingEngineRef = useRef<Types.IRenderingEngine | null>(null);
  const dicomFileRef = useRef<string>("");
  const annotationHistoryRef = useRef<any[]>([]);
  const savedAnnotationsRef = useRef<any[]>([]);

  const [isInitialized, setIsInitialized] = useState(false);
  const [contrast, setContrast] = useState(data.viewer.configs.contrast);
  const [brightness, setBrightness] = useState(data.viewer.configs.brightness);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    initializeCornerstone();
    setIsInitialized(true);
    return () => {
      annotation.state.removeAllAnnotations();
      ToolGroupManager.destroyToolGroup(toolGroupId);
      renderingEngineRef.current?.destroy();
      cache.purgeCache();
    };
  }, [toolGroupId]);

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

    eventTarget.addEventListener(Enums.Events.ANNOTATION_ADDED, handleAnnotationAdded);

    return () => {
      eventTarget.removeEventListener(Enums.Events.ANNOTATION_ADDED, handleAnnotationAdded);
    };
  }, [isInitialized, viewportId]);

  useEffect(() => {
    if (!isInitialized || !elementRef.current) return;

    const initializeViewer = async () => {
      const element = elementRef.current;
      if (!element) return;
      cache.purgeCache();
      const renderingEngine = createRenderingEngine(renderingEngineId);
      renderingEngineRef.current = renderingEngine;
      const viewport = setup2dViewport(renderingEngine, element, viewportId);
      viewportRef.current = viewport;
      console.log(viewport);
      setupViewer(toolGroupId, viewportId, renderingEngineId, stackViewerConfig);

      const imageUrl = data.viewer.imageUrl;
      dicomFileRef.current = imageUrl;

      await loadDicomStack(viewport, imageUrl);
      // Apply both contrast and brightness together
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

  const handleUndo = () => {
    if (annotationHistoryRef.current.length === 0 || !viewportRef.current) return;

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
    await saveStackConfig(data.id, {
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

  const handleToolSelect = (toolName: string) => {
    setPrimaryTool(toolName, viewportId);
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
