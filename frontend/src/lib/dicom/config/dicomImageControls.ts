import { Types } from "@cornerstonejs/core";
import { vec3, mat4 } from "gl-matrix";

export const stackOriginalPoints = new Map<string, { center: number; width: number }>();

export function applyWindowLevel(
  viewport: Types.IStackViewport,
  contrast: number,
  brightness: number
): void {
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
}

const volumeOriginalPoints = new Map<string, number[][]>();

export function adjustVolumeShift(viewport: Types.IVolumeViewport, shiftValue: number): void {
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
}

/**
 * Flip viewport vertically
 */
export function flipViewportVertical(viewport: Types.IStackViewport | Types.IVolumeViewport): void {
  if (!viewport) return;

  const camera = viewport.getCamera();
  const viewUp = camera.viewUp;
  if (!viewUp) return;

  viewport.setCamera({
    ...camera,
    viewUp: [-viewUp[0], -viewUp[1], -viewUp[2]],
  });

  viewport.render();
}

/**
 * Flip viewport horizontally
 */
export function flipViewportHorizontal(viewport: Types.IStackViewport | Types.IVolumeViewport): void {
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
}

/**
 * Rotate viewport clockwise by 90 degrees
 */
export function rotateViewportClockwise(viewport: Types.IStackViewport | Types.IVolumeViewport): void {
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
}

/**
 * Rotate viewport counter-clockwise by 90 degrees
 */
export function rotateViewportCounterClockwise(viewport: Types.IStackViewport | Types.IVolumeViewport): void {
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
}

/**
 * Apply contrast change to viewport
 */
export function applyContrastChange(
  viewport: Types.IStackViewport | Types.IVolumeViewport,
  contrast: number,
  currentBrightness: number
): void {
  if (!viewport || !('setProperties' in viewport)) return;
  applyWindowLevel(viewport as Types.IStackViewport, contrast, currentBrightness);
}

/**
 * Apply brightness change to viewport
 */
export function applyBrightnessChange(
  viewport: Types.IStackViewport | Types.IVolumeViewport,
  brightness: number,
  currentContrast: number
): void {
  if (!viewport || !('setProperties' in viewport)) return;
  applyWindowLevel(viewport as Types.IStackViewport, currentContrast, brightness);
}
