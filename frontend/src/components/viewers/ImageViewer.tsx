import { useRef, useEffect, useState } from "react";
import { Types } from "@cornerstonejs/core";
import { MedicalImageViewerProps } from "@/shared/types";
import ViewerControls from "../toolbar/ViewerControls";
import { saveImageConfig } from "@/shared/api";
import { useViewportResize } from "@/hooks/useViewportResize";
import { useViewerInitialization } from "@/hooks/useViewerInitialization";
import { useAnnotationUndo } from "@/hooks/useAnnotationUndo";
import { useViewerCleanup } from "@/hooks/useViewerCleanup";
import { getViewportAnnotations } from "@/lib/dicom/config/annotationLoader";
import { setupSingleImageViewer } from "@/lib/dicom/utils/viewerUtils";
import { useViewportControls } from "@/hooks/useViewportControls";
import { handleToolSelection } from "@/lib/dicom/config/dicomAnnotationControl";

export default function ImageViewer({ data }: MedicalImageViewerProps) {
  // Generate unique IDs for this viewer instance
  const renderingEngineId = `renderingEngine_${data.id}`;
  const viewportId = `viewport_${data.id}`;
  const toolGroupId = `toolGroup_${data.id}`;

  const elementRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<Types.IStackViewport | Types.IVolumeViewport | null>(null);
  const renderingEngineRef = useRef<Types.IRenderingEngine | null>(null);

  const { isInitialized } = useViewerInitialization({
    needsWebImageLoader: true
  });

  // Direct state management - Initialize from backend data only (no frontend defaults)
  const [contrast, setContrast] = useState(data.viewer.configs.contrast);
  const [brightness, setBrightness] = useState(data.viewer.configs.brightness);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isInverted, setIsInverted] = useState(data.viewer.configs.isInverted);
  const [isGrayscale, setIsGrayscale] = useState(data.viewer.configs.isGrayscale);
  const [sharpness, setSharpness] = useState(data.viewer.configs.sharpness);
  const [gammaR, setGammaR] = useState(data.viewer.configs.gammaR);
  const [gammaG, setGammaG] = useState(data.viewer.configs.gammaG);
  const [gammaB, setGammaB] = useState(data.viewer.configs.gammaB);

  // Viewport controls hook
  const {
    applyWindowLevel,
    applyContrastChange,
    applyBrightnessChange,
    flipViewportVertical,
    flipViewportHorizontal,
    rotateViewportClockwise,
    rotateViewportCounterClockwise,
    toggleViewportInvert,
    toggleViewportGrayscale,
    applyViewportSharpness,
    applyViewportRGBGamma,
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
      const { renderingEngine, viewport } = await setupSingleImageViewer({
        element,
        renderingEngineId,
        viewportId,
        toolGroupId,
        imageUrl: data.viewer.imageUrl,
        annotations: data.viewer.configs.annotations
      });

      renderingEngineRef.current = renderingEngine;
      viewportRef.current = viewport;

      // Apply initial contrast and brightness
      applyWindowLevel(viewport as Types.IStackViewport, data.viewer.configs.contrast, data.viewer.configs.brightness);

      // Apply initial image enhancement settings using individual functions
      const applyInitialFilters = () => {
        if (viewportRef.current) {
          applyViewportSharpness(viewportRef.current, sharpness);
          applyViewportRGBGamma(viewportRef.current, gammaR, gammaG, gammaB);
          if (isGrayscale) {
            toggleViewportGrayscale(viewportRef.current, isGrayscale);
          }
          if (isInverted) {
            toggleViewportInvert(viewportRef.current, isInverted);
          }
        }
      };

      // Apply filters with multiple attempts to ensure they stick
      setTimeout(applyInitialFilters, 50);
      setTimeout(applyInitialFilters, 200);
      setTimeout(applyInitialFilters, 500);
    };

    initializeViewer();
  }, [isInitialized, data, renderingEngineId, viewportId, toolGroupId]);

  // Reapply image enhancement filters when viewport is ready
  useEffect(() => {
    if (viewportRef.current) {
      const viewport = viewportRef.current;

      // Function to apply all filters using individual functions
      const applyAllFilters = () => {
        try {
          applyViewportSharpness(viewport, sharpness);
          applyViewportRGBGamma(viewport, gammaR, gammaG, gammaB);
          if (isGrayscale) {
            toggleViewportGrayscale(viewport, isGrayscale);
          }
          if (isInverted) {
            toggleViewportInvert(viewport, isInverted);
          }
        } catch (error) {
          console.warn('Failed to apply image enhancement filters:', error);
        }
      };

      // Try immediately, then with delays if needed
      applyAllFilters();

      const timeoutId1 = setTimeout(applyAllFilters, 100);
      const timeoutId2 = setTimeout(applyAllFilters, 300);

      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
      };
    }
  }, [viewportRef.current, sharpness, gammaR, gammaG, gammaB, isGrayscale, isInverted]);

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
    await saveImageConfig(data.id, {
      contrast,
      brightness,
      isInverted,
      isGrayscale,
      sharpness,
      gammaR,
      gammaG,
      gammaB,
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

  const handleInvertToggle = () => {
    if (viewportRef.current) {
      const newInvertState = !isInverted;
      setIsInverted(newInvertState);
      toggleViewportInvert(viewportRef.current, newInvertState);
    }
  };

  const handleGrayscaleToggle = () => {
    if (viewportRef.current) {
      const newGrayscaleState = !isGrayscale;
      setIsGrayscale(newGrayscaleState);
      toggleViewportGrayscale(viewportRef.current, newGrayscaleState);
    }
  };

  const handleSharpnessChange = (value: number) => {
    if (viewportRef.current) {
      setSharpness(value);
      applyViewportSharpness(viewportRef.current, value);
    }
  };

  const handleGammaRChange = (value: number) => {
    if (viewportRef.current) {
      setGammaR(value);
      applyViewportRGBGamma(viewportRef.current, value, gammaG, gammaB);
    }
  };

  const handleGammaGChange = (value: number) => {
    if (viewportRef.current) {
      setGammaG(value);
      applyViewportRGBGamma(viewportRef.current, gammaR, value, gammaB);
    }
  };

  const handleGammaBChange = (value: number) => {
    if (viewportRef.current) {
      setGammaB(value);
      applyViewportRGBGamma(viewportRef.current, gammaR, gammaG, value);
    }
  };

  const handleToolSelect = (toolName: string) => {
    handleToolSelection(toolName, viewportId, setActiveTool);
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
        isInverted={isInverted}
        handleInvertToggle={handleInvertToggle}
        isGrayscale={isGrayscale}
        handleGrayscaleToggle={handleGrayscaleToggle}
        showGrayscaleToggle={true}
        grayscaleDisabled={false}
        sharpness={sharpness}
        handleSharpnessChange={handleSharpnessChange}
        gammaR={gammaR}
        gammaG={gammaG}
        gammaB={gammaB}
        handleGammaRChange={handleGammaRChange}
        handleGammaGChange={handleGammaGChange}
        handleGammaBChange={handleGammaBChange}
        showImageEnhancement={true}
      />
    </div>
  );
}
