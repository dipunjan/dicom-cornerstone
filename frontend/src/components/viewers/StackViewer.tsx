import { useRef, useEffect, useState } from "react";
import { Types, cache } from "@cornerstonejs/core";
import { ToolGroupManager, annotation } from "@cornerstonejs/tools";
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

  const [isInitialized, setIsInitialized] = useState(false);
  const [contrast, setContrast] = useState(data.viewer.configs.contrast);
  const [brightness, setBrightness] = useState(data.viewer.configs.brightness);

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
      }
    };

    initializeViewer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, data]);

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
      />
    </div>
  );
}
