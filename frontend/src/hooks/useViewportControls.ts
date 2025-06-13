import { useState, useCallback } from "react";
import { Types } from "@cornerstonejs/core";
import { ToolGroupManager } from "@cornerstonejs/tools";
import { vec3, mat4 } from "gl-matrix";
import { setup3DVolumeViewer, setup2DVolumeViewer, ViewerSetupResult } from "@/lib/dicom/utils/viewerUtils";

export const stackOriginalPoints = new Map<string, { center: number; width: number }>();
const volumeOriginalPoints = new Map<string, number[][]>();

interface UseViewportControlsProps {
  initialShift?: number;
  renderingEngineId?: string;
  viewportId?: string;
  toolGroupId?: string;
  dataId?: string;
}

/**
 * Custom hook for all viewport manipulation functions including volume controls
 */
export function useViewportControls(props?: UseViewportControlsProps) {
  // Volume-specific state (only used when props are provided)
  const [shift, setShift] = useState(props?.initialShift || 0);
  const [is3D, setIs3D] = useState(true);
  
  /**
   * Apply window level adjustments to viewport
   */
  const applyWindowLevel = (
    viewport: Types.IStackViewport,
    contrast: number,
    brightness: number
  ): void => {
    const viewportId = viewport.id || "default";

    // Cache the original VOI if not already cached
    if (!stackOriginalPoints.has(viewportId)) {
      const { lower, upper } = viewport.getProperties().voiRange!;
      const center = (upper + lower) / 2;
      const width = upper - lower;
      stackOriginalPoints.set(viewportId, { center, width });
    }

    const { center: baseCenter, width: baseWidth } = stackOriginalPoints.get(viewportId)!;

    // Calculate new width (contrast)
    let scaleFactor = 1 - contrast / 127;
    scaleFactor = Math.max(0.1, scaleFactor);
    const newWidth = baseWidth * scaleFactor;

    // Calculate new center (brightness)
    const shift = (-brightness / 127) * baseWidth;
    const newCenter = baseCenter + shift;

    viewport.setProperties({
      voiRange: {
        lower: newCenter - newWidth / 2,
        upper: newCenter + newWidth / 2,
      },
    });
    viewport.render();
  };

  /**
   * Apply contrast change to viewport
   */
  const applyContrastChange = (
    viewport: Types.IStackViewport | Types.IVolumeViewport,
    contrast: number,
    currentBrightness: number
  ): void => {
    if (!viewport || !('setProperties' in viewport)) return;
    applyWindowLevel(viewport as Types.IStackViewport, contrast, currentBrightness);
  };

  /**
   * Apply brightness change to viewport
   */
  const applyBrightnessChange = (
    viewport: Types.IStackViewport | Types.IVolumeViewport,
    brightness: number,
    currentContrast: number
  ): void => {
    if (!viewport || !('setProperties' in viewport)) return;
    applyWindowLevel(viewport as Types.IStackViewport, currentContrast, brightness);
  };

  /**
   * Flip viewport vertically
   */
  const flipViewportVertical = (viewport: Types.IStackViewport | Types.IVolumeViewport): void => {
    if (!viewport) return;

    const camera = viewport.getCamera();
    const viewUp = camera.viewUp;
    if (!viewUp) return;

    viewport.setCamera({
      ...camera,
      viewUp: [-viewUp[0], -viewUp[1], -viewUp[2]],
    });

    viewport.render();
  };

  /**
   * Flip viewport horizontally
   */
  const flipViewportHorizontal = (viewport: Types.IStackViewport | Types.IVolumeViewport): void => {
    if (!viewport) return;

    const camera = viewport.getCamera();
    if (!camera.position || !camera.focalPoint || !camera.viewUp) return;

    const position = vec3.clone(camera.position);
    const focalPoint = vec3.clone(camera.focalPoint);
    const viewUp = vec3.clone(camera.viewUp);

    const viewDir = vec3.create();
    vec3.subtract(viewDir, position, focalPoint);

    const rotationMatrix = mat4.create();
    mat4.fromRotation(rotationMatrix, Math.PI, viewUp);

    const rotatedDir = vec3.create();
    vec3.transformMat4(rotatedDir, viewDir, rotationMatrix);

    const newPosition = vec3.create();
    vec3.add(newPosition, focalPoint, rotatedDir);

    viewport.setCamera({
      position: [newPosition[0], newPosition[1], newPosition[2]],
      focalPoint: [focalPoint[0], focalPoint[1], focalPoint[2]],
      viewUp: [viewUp[0], viewUp[1], viewUp[2]], // unchanged
    });

    viewport.render();
  };

  /**
   * Rotate viewport clockwise by 90 degrees
   */
  const rotateViewportClockwise = (viewport: Types.IStackViewport | Types.IVolumeViewport): void => {
    if (!viewport) return;

    const camera = viewport.getCamera();
    if (!camera.viewUp || !camera.viewPlaneNormal) return;

    const viewUp = vec3.clone(camera.viewUp);
    const viewPlaneNormal = vec3.clone(camera.viewPlaneNormal);

    // Calculate the right vector (cross product of viewPlaneNormal and viewUp)
    const rightVector = vec3.create();
    vec3.cross(rightVector, viewPlaneNormal, viewUp);
    vec3.normalize(rightVector, rightVector);

    // For 90-degree clockwise rotation: new viewUp = -rightVector
    const newViewUp = vec3.create();
    vec3.negate(newViewUp, rightVector);

    viewport.setCamera({
      ...camera,
      viewUp: [newViewUp[0], newViewUp[1], newViewUp[2]],
    });

    viewport.render();
  };

  /**
   * Rotate viewport counter-clockwise by 90 degrees
   */
  const rotateViewportCounterClockwise = (viewport: Types.IStackViewport | Types.IVolumeViewport): void => {
    if (!viewport) return;

    const camera = viewport.getCamera();
    if (!camera.viewUp || !camera.viewPlaneNormal) return;

    const viewUp = vec3.clone(camera.viewUp);
    const viewPlaneNormal = vec3.clone(camera.viewPlaneNormal);

    // Calculate the right vector (cross product of viewPlaneNormal and viewUp)
    const rightVector = vec3.create();
    vec3.cross(rightVector, viewPlaneNormal, viewUp);
    vec3.normalize(rightVector, rightVector);

    // For 90-degree counter-clockwise rotation: new viewUp = rightVector
    viewport.setCamera({
      ...camera,
      viewUp: [rightVector[0], rightVector[1], rightVector[2]],
    });

    viewport.render();
  };

  /**
   * Toggle viewport invert (grayscale inversion)
   */
  const toggleViewportInvert = (viewport: Types.IStackViewport | Types.IVolumeViewport, isInverted: boolean): void => {
    if (!viewport || !('setProperties' in viewport)) return;

    viewport.setProperties({ invert: isInverted });
    viewport.render();
  };

  // Store filter states for persistent application
  const filterStates = new Map<string, { sharpness: number; gammaR: number; gammaG: number; gammaB: number; grayscale: boolean }>();
  const filterObservers = new Map<HTMLCanvasElement, MutationObserver>();

  /**
   * Apply persistent filters that survive Cornerstone resets
   */
  const applyPersistentFilters = (canvas: HTMLCanvasElement, viewportId: string): void => {
    const state = filterStates.get(viewportId);
    if (!state) return;

    const filters: string[] = [];

    // Grayscale
    if (state.grayscale) {
      filters.push('grayscale(100%)');
    }

    // Sharpness
    if (state.sharpness !== 100) {
      if (state.sharpness > 100) {
        const intensity = 1 + (state.sharpness - 100) / 100;
        const contrastValue = Math.min(200, 100 * intensity);
        const saturateValue = Math.min(150, 100 * intensity);
        filters.push(`contrast(${contrastValue}%)`);
        filters.push(`saturate(${saturateValue}%)`);
      } else {
        const blurAmount = (100 - state.sharpness) / 50;
        filters.push(`blur(${blurAmount}px)`);
      }
    }

    // RGB Gamma - Unified approach for proper color channel control
    const rDiff = state.gammaR - 1.0;
    const gDiff = state.gammaG - 1.0;
    const bDiff = state.gammaB - 1.0;

    // Calculate combined effects for all RGB channels
    if (Math.abs(rDiff) > 0.01 || Math.abs(gDiff) > 0.01 || Math.abs(bDiff) > 0.01) {

      // Calculate overall brightness from average gamma
      const avgGamma = (state.gammaR + state.gammaG + state.gammaB) / 3;
      let brightnessValue = 100;
      if (Math.abs(avgGamma - 1.0) > 0.01) {
        if (avgGamma < 1.0) {
          brightnessValue = 70 + (avgGamma * 30); // 70-100%
        } else {
          brightnessValue = 100 + ((avgGamma - 1.0) * 30); // 100-130%
        }
        filters.push(`brightness(${brightnessValue.toFixed(1)}%)`);
      }

      // Calculate RGB-specific effects using correct color wheel positions
      // Color wheel: Red=0°, Yellow=60°, Green=120°, Cyan=180°, Blue=240°, Magenta=300°

      // Red channel effects - Enhanced for stronger red response
      if (Math.abs(rDiff) > 0.01) {
        if (rDiff > 0) {
          // Increase red: Strong red enhancement
          const sepiaAmount = Math.min(60, rDiff * 40);
          filters.push(`sepia(${sepiaAmount}%)`);
          // Stronger shift toward red-orange
          filters.push(`hue-rotate(${-rDiff * 20}deg)`);
          // Boost saturation for more vivid red
          filters.push(`saturate(${100 + rDiff * 25}%)`);
          // Slight contrast boost for red definition
          filters.push(`contrast(${100 + rDiff * 10}%)`);
        } else {
          // Decrease red: Strong shift toward cyan (opposite of red)
          filters.push(`hue-rotate(${Math.abs(rDiff) * 60}deg)`);
          // Boost saturation to make cyan more visible
          filters.push(`saturate(${100 + Math.abs(rDiff) * 20}%)`);
        }
      }

      // Green channel effects - Fix: Green is at 120° on color wheel
      if (Math.abs(gDiff) > 0.01) {
        if (gDiff > 0) {
          // Increase green: Shift toward green (120°)
          // From default position, need positive rotation toward green
          filters.push(`hue-rotate(${gDiff * 50}deg)`); // Positive for green
          filters.push(`saturate(${100 + gDiff * 20}%)`);
        } else {
          // Decrease green: Shift toward magenta (300° = -60°)
          filters.push(`hue-rotate(${Math.abs(gDiff) * -40}deg)`); // Negative for magenta
        }
      }

      // Blue channel effects - Fix: Blue is at 240° on color wheel
      if (Math.abs(bDiff) > 0.01) {
        if (bDiff > 0) {
          // Increase blue: Shift toward blue (240° = -120° from 0°)
          // Need negative rotation to reach blue from red
          filters.push(`hue-rotate(${bDiff * -80}deg)`); // Negative for blue
          filters.push(`brightness(${Math.max(85, 100 - bDiff * 10)}%)`);
        } else {
          // Decrease blue: Shift toward yellow (60°)
          filters.push(`hue-rotate(${Math.abs(bDiff) * 30}deg)`); // Positive for yellow
          filters.push(`brightness(${Math.min(115, 100 + Math.abs(bDiff) * 10)}%)`);
        }
      }

      // Add overall saturation boost if multiple channels are changed
      const totalColorChange = Math.abs(rDiff) + Math.abs(gDiff) + Math.abs(bDiff);
      if (totalColorChange > 0.1) {
        const saturationBoost = 100 + (totalColorChange * 15);
        filters.push(`saturate(${Math.min(150, saturationBoost).toFixed(1)}%)`);
      }
    }

    // Apply the filter
    const finalFilter = filters.length > 0 ? filters.join(' ') : 'none';

    // Force the filter application
    canvas.style.setProperty('filter', finalFilter, 'important');
  };

  /**
   * Setup persistent filter monitoring for a canvas
   */
  const setupFilterMonitoring = (canvas: HTMLCanvasElement, viewportId: string): void => {
    // Remove existing observer if any
    const existingObserver = filterObservers.get(canvas);
    if (existingObserver) {
      existingObserver.disconnect();
    }

    // Create new observer to watch for style changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const currentFilter = canvas.style.filter;
          if (currentFilter === 'none' || currentFilter === '') {
            applyPersistentFilters(canvas, viewportId);
          }
        }
      });
    });

    observer.observe(canvas, {
      attributes: true,
      attributeFilter: ['style']
    });

    filterObservers.set(canvas, observer);
  };

  /**
   * Apply sharpness filter to viewport (persistent version)
   */
  const applyViewportSharpness = (viewport: Types.IStackViewport | Types.IVolumeViewport, sharpness: number): void => {
    if (!viewport) return;

    const canvas = viewport.getCanvas();
    if (!canvas) {
      setTimeout(() => applyViewportSharpness(viewport, sharpness), 100);
      return;
    }

    const viewportId = viewport.id || 'default';

    // Update filter state
    const currentState = filterStates.get(viewportId) || { sharpness: 100, gammaR: 1.0, gammaG: 1.0, gammaB: 1.0, grayscale: false };
    currentState.sharpness = Math.max(0, Math.min(200, sharpness));
    filterStates.set(viewportId, currentState);

    // Setup monitoring if not already done
    if (!filterObservers.has(canvas)) {
      setupFilterMonitoring(canvas, viewportId);
    }

    // Apply filters
    applyPersistentFilters(canvas, viewportId);
  };

  /**
   * Apply RGB gamma correction (persistent version)
   */
  const applyViewportRGBGamma = (
    viewport: Types.IStackViewport | Types.IVolumeViewport,
    gammaR: number,
    gammaG: number,
    gammaB: number
  ): void => {
    if (!viewport) return;

    const canvas = viewport.getCanvas();
    if (!canvas) {
      setTimeout(() => applyViewportRGBGamma(viewport, gammaR, gammaG, gammaB), 100);
      return;
    }

    const viewportId = viewport.id || 'default';

    // Update filter state
    const currentState = filterStates.get(viewportId) || { sharpness: 100, gammaR: 1.0, gammaG: 1.0, gammaB: 1.0, grayscale: false };
    currentState.gammaR = Math.max(0.2, Math.min(2.5, gammaR));
    currentState.gammaG = Math.max(0.2, Math.min(2.5, gammaG));
    currentState.gammaB = Math.max(0.2, Math.min(2.5, gammaB));
    filterStates.set(viewportId, currentState);

    // Setup monitoring if not already done
    if (!filterObservers.has(canvas)) {
      setupFilterMonitoring(canvas, viewportId);
    }

    // Apply filters
    applyPersistentFilters(canvas, viewportId);
  };

  /**
   * Toggle viewport grayscale (persistent version)
   */
  const toggleViewportGrayscale = (viewport: Types.IStackViewport | Types.IVolumeViewport, isGrayscale: boolean): void => {
    if (!viewport) return;

    const canvas = viewport.getCanvas();
    if (!canvas) return;

    const viewportId = viewport.id || 'default';

    // Update filter state
    const currentState = filterStates.get(viewportId) || { sharpness: 100, gammaR: 1.0, gammaG: 1.0, gammaB: 1.0, grayscale: false };
    currentState.grayscale = isGrayscale;
    filterStates.set(viewportId, currentState);

    // Setup monitoring if not already done
    if (!filterObservers.has(canvas)) {
      setupFilterMonitoring(canvas, viewportId);
    }

    // Apply filters
    applyPersistentFilters(canvas, viewportId);
  };

  /**
   * Adjust volume shift for 3D viewport
   */
  const adjustVolumeShift = (viewport: Types.IVolumeViewport, shiftValue: number): void => {
    const viewportId = viewport.id || "default";

    if (!volumeOriginalPoints.has(viewportId)) {
      const volumeActor = viewport.getDefaultActor().actor as Types.VolumeActor;
      const ofun = volumeActor.getProperty().getScalarOpacity(0);

      const opacityPointValues = [];
      const size = ofun.getSize();
      for (let pointIdx = 0; pointIdx < size; pointIdx++) {
        const opacityPointValue = [0, 0, 0, 0];
        ofun.getNodeValue(pointIdx, opacityPointValue);
        opacityPointValues.push([...opacityPointValue]);
      }
      volumeOriginalPoints.set(viewportId, opacityPointValues);
    }

    const originalPoints = volumeOriginalPoints.get(viewportId);
    if (!originalPoints || originalPoints.length === 0) return;

    const volumeActor = viewport.getDefaultActor().actor as Types.VolumeActor;
    const ofun = volumeActor.getProperty().getScalarOpacity(0);

    ofun.removeAllPoints();
    originalPoints.forEach((opacityPointValue) => {
      const shiftedPoint = [...opacityPointValue];
      shiftedPoint[0] += shiftValue;
      ofun.addPoint(shiftedPoint[0], shiftedPoint[1]);
    });

    viewport.render();
  };

  /**
   * Handle shift change for volume viewport
   */
  const handleShiftChange = (value: number, viewport: Types.IVolumeViewport | null) => {
    if (!viewport || !is3D) return;
    setShift(value);
    adjustVolumeShift(viewport, value);
  };

  /**
   * Switch to 3D volume rendering
   */
  const switchTo3D = useCallback(async (
    element: HTMLDivElement | null,
    renderingEngine: Types.IRenderingEngine | null,
    imageUrls: string[],
  ): Promise<ViewerSetupResult | null> => {
    if (!element || !renderingEngine || !props) return null;

    ToolGroupManager.destroyToolGroup(props.toolGroupId!);

    const result = await setup3DVolumeViewer({
      element,
      renderingEngineId: props.renderingEngineId!,
      viewportId: props.viewportId!,
      toolGroupId: props.toolGroupId!,
      imageUrls,
      volumeId: `dicomVolume_${props.dataId}`
    });

    setIs3D(true);
    return result;
  }, [props]);

  /**
   * Switch to 2D stack rendering
   */
  const switchTo2D = useCallback(async (
    element: HTMLDivElement | null,
    renderingEngine: Types.IRenderingEngine | null,
    imageUrls: string[],
  ): Promise<ViewerSetupResult | null> => {
    if (!element || !renderingEngine || !props) return null;

    ToolGroupManager.destroyToolGroup(props.toolGroupId!);

    const result = await setup2DVolumeViewer({
      element,
      renderingEngineId: props.renderingEngineId!,
      viewportId: props.viewportId!,
      toolGroupId: props.toolGroupId!,
      imageUrls
    });

    setIs3D(false);
    return result;
  }, [props]);

  return {
    // Basic viewport functions
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
    adjustVolumeShift,

    // Volume-specific functions (only available when props are provided)
    ...(props && {
      shift,
      is3D,
      handleShiftChange,
      switchTo3D,
      switchTo2D,
      setIs3D
    })
  };
}
