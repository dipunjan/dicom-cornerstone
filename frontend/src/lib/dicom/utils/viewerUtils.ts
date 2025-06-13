import { Types, cache } from "@cornerstonejs/core";
import {
  createRenderingEngine,
  createStackViewport,
  createVolumeViewport,
  loadStackData,
  loadVolumeData
} from "@/lib/dicom/core/dicomRenderingEngine";
import {
  setupViewer,
  stackViewerConfig,
  volumeViewerConfig,
  volume2dModeConfig
} from "@/lib/dicom/config/dicomAnnotationControl";
import { restoreViewportAnnotations } from "@/lib/dicom/config/annotationLoader";

/**
 * Result interface for viewer setup operations
 */
export interface ViewerSetupResult {
  renderingEngine: Types.IRenderingEngine;
  viewport: Types.IStackViewport | Types.IVolumeViewport;
}

/**
 * Common setup parameters for all viewers
 */
interface BaseViewerParams {
  element: HTMLDivElement;
  renderingEngineId: string;
  viewportId: string;
  toolGroupId: string;
  annotations?: any[];
}

/**
 * Clears cache and sets up common viewer infrastructure
 */
function initializeViewer(renderingEngineId: string): Types.IRenderingEngine {
  cache.purgeCache();
  return createRenderingEngine(renderingEngineId);
}

/**
 * Sets up a single image viewer (web images)
 */
export async function setupSingleImageViewer(
  params: BaseViewerParams & { imageUrl: string }
): Promise<ViewerSetupResult> {
  const { element, renderingEngineId, viewportId, toolGroupId, imageUrl, annotations } = params;

  const renderingEngine = initializeViewer(renderingEngineId);
  const viewport = createStackViewport(renderingEngine, element, viewportId);

  setupViewer(toolGroupId, viewportId, renderingEngineId, stackViewerConfig);

  const webImageId = `web:${imageUrl}`;
  await viewport.setStack([webImageId]);

  if (annotations) {
    restoreViewportAnnotations(annotations, viewportId, viewport);
  }

  return { renderingEngine, viewport };
}

/**
 * Sets up a DICOM stack viewer (multiple DICOM images)
 */
export async function setupDicomStackViewer(
  params: BaseViewerParams & { imageUrls: string | string[] }
): Promise<ViewerSetupResult> {
  const { element, renderingEngineId, viewportId, toolGroupId, imageUrls, annotations } = params;

  const renderingEngine = initializeViewer(renderingEngineId);
  const viewport = createStackViewport(renderingEngine, element, viewportId);

  setupViewer(toolGroupId, viewportId, renderingEngineId, stackViewerConfig);

  await loadStackData(viewport, imageUrls);

  if (annotations) {
    restoreViewportAnnotations(annotations, viewportId, viewport);
  }

  return { renderingEngine, viewport };
}

/**
 * Sets up a 3D volume viewer
 */
export async function setup3DVolumeViewer(
  params: BaseViewerParams & { imageUrls: string[]; volumeId: string }
): Promise<ViewerSetupResult> {
  const { element, renderingEngineId, viewportId, toolGroupId, imageUrls, volumeId } = params;

  const renderingEngine = initializeViewer(renderingEngineId);
  const viewport = createVolumeViewport(renderingEngine, element, viewportId);

  setupViewer(toolGroupId, viewportId, renderingEngineId, volumeViewerConfig);

  await loadVolumeData(viewport, imageUrls, volumeId, "CT-Bone");

  return { renderingEngine, viewport };
}

/**
 * Sets up a 2D volume viewer (volume data in 2D mode)
 */
export async function setup2DVolumeViewer(
  params: BaseViewerParams & { imageUrls: string[] }
): Promise<ViewerSetupResult> {
  const { element, renderingEngineId, viewportId, toolGroupId, imageUrls, annotations } = params;

  const renderingEngine = initializeViewer(renderingEngineId);
  const viewport = createStackViewport(renderingEngine, element, viewportId);

  setupViewer(toolGroupId, viewportId, renderingEngineId, volume2dModeConfig);
  await loadStackData(viewport, imageUrls);

  if (annotations) {
    restoreViewportAnnotations(annotations, viewportId, viewport);
  }

  return { renderingEngine, viewport };
}
