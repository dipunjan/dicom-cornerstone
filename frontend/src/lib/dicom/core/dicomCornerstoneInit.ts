import { init as csRenderInit } from "@cornerstonejs/core";
import { init as csToolsInit } from "@cornerstonejs/tools";
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";
import {
  volumeLoader,
  cornerstoneStreamingImageVolumeLoader,
} from "@cornerstonejs/core";

let isInitialized = false;

export function initializeCornerstone() {
  if (isInitialized) {
    return;
  }
  csRenderInit();
  csToolsInit();
  const numberOfWorkers = navigator.hardwareConcurrency || 4;
  dicomImageLoaderInit({ maxWebWorkers: numberOfWorkers });
  volumeLoader.registerUnknownVolumeLoader(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cornerstoneStreamingImageVolumeLoader as any
  );
  isInitialized = true;
}
