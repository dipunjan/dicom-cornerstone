import { useRef, useEffect, useState } from "react";
import { Types, cache, setUseCPURendering } from "@cornerstonejs/core";
import { annotation, ToolGroupManager } from "@cornerstonejs/tools";
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [contrast, setContrast] = useState(data.viewer.configs.contrast);
  const [brightness, setBrightness] = useState(data.viewer.configs.brightness);

  useEffect(() => {
    initializeCornerstone();
    registerWebImageLoader();
    setUseCPURendering(true); // Enable CPU rendering for this viewer
    setIsInitialized(true);
    return () => {
      annotation.state.removeAllAnnotations();
      ToolGroupManager.destroyToolGroup(toolGroupId);
      renderingEngineRef.current?.destroy();
      cache.purgeCache();
      setUseCPURendering(false);
    };
  }, [toolGroupId]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const initializeViewer = async () => {
      const element = elementRef.current;
      if (!element) return;
      // while (element.firstChild) {
      //   element.removeChild(element.firstChild);
      // }
      cache.purgeCache();
      const renderingEngine = createRenderingEngine(renderingEngineId);
      renderingEngineRef.current = renderingEngine;
      const viewport = setup2dViewport(renderingEngine, element, viewportId);
      viewportRef.current = viewport;
      console.log(viewport);
      setupViewer(toolGroupId, viewportId, renderingEngineId, stackViewerConfig);

      const imageUrl = data.viewer.imageUrl;
      const webImageId = `web:${imageUrl}`;

      await viewport.setStack([webImageId]);
      applyWindowLevel(viewport, contrast, brightness);

      if (data.viewer.configs.annotations) {
        restoreViewportAnnotations(data.viewer.configs.annotations, viewportId, viewport);
      }
    };

    initializeViewer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, data]);

  useViewportResize(renderingEngineRef, viewportId, isInitialized);

  const handleToolSelect = (toolName: string) => {
    setPrimaryTool(toolName, viewportId);
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
      />
    </div>
  );
}
