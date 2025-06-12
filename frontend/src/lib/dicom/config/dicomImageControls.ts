import { Types } from "@cornerstonejs/core";

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
