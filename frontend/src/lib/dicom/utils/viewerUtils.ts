import { Types, cache } from "@cornerstonejs/core";
import {
  createRenderingEngine,
  setup2dViewport,
  setup3dViewport,
  loadDicomStack,
  loadDicomVolume
} from "@/lib/dicom/core/dicomRenderingEngine";
import {
  setupViewer,
  stackViewerConfig,
  volumeViewerConfig,
  volume2dModeConfig
} from "@/lib/dicom/config/dicomAnnotationControl";

import { restoreViewportAnnotations } from "@/lib/dicom/config/annotationLoader";

export interface ViewerSetupResult {
  renderingEngine: Types.IRenderingEngine;
  viewport: Types.IStackViewport | Types.IVolumeViewport;
}

export async function setupImageViewer(
  element: HTMLDivElement,
  renderingEngineId: string,
  viewportId: string,
  toolGroupId: string,
  imageUrl: string,
  annotations?: any[]
): Promise<ViewerSetupResult> {
  cache.purgeCache();

  const renderingEngine = createRenderingEngine(renderingEngineId);
  const viewport = setup2dViewport(renderingEngine, element, viewportId);

  setupViewer(toolGroupId, viewportId, renderingEngineId, stackViewerConfig);

  const webImageId = `web:${imageUrl}`;
  await viewport.setStack([webImageId]);

  if (annotations) {
    restoreViewportAnnotations(annotations, viewportId, viewport);
  }

  return { renderingEngine, viewport };
}

export async function setupStackViewer(
  element: HTMLDivElement,
  renderingEngineId: string,
  viewportId: string,
  toolGroupId: string,
  imageUrl: string | string[],
  annotations?: any[]
): Promise<ViewerSetupResult> {
  cache.purgeCache();

  const renderingEngine = createRenderingEngine(renderingEngineId);
  const viewport = setup2dViewport(renderingEngine, element, viewportId);

  setupViewer(toolGroupId, viewportId, renderingEngineId, stackViewerConfig);

  await loadDicomStack(viewport, imageUrl);

  if (annotations) {
    restoreViewportAnnotations(annotations, viewportId, viewport);
  }

  return { renderingEngine, viewport };
}

export async function setupVolumeViewer3D(
  element: HTMLDivElement,
  renderingEngineId: string,
  viewportId: string,
  toolGroupId: string,
  imageUrls: string[],
  volumeId: string
): Promise<ViewerSetupResult> {
  cache.purgeCache();

  const renderingEngine = createRenderingEngine(renderingEngineId);
  const viewport = setup3dViewport(renderingEngine, element, viewportId);

  setupViewer(toolGroupId, viewportId, renderingEngineId, volumeViewerConfig);

  await loadDicomVolume(viewport, imageUrls, "CT-Bone", volumeId);
  return { renderingEngine, viewport };
}

export async function setupVolumeViewer2D(
  element: HTMLDivElement,
  renderingEngineId: string,
  viewportId: string,
  toolGroupId: string,
  imageUrls: string[],
): Promise<ViewerSetupResult> {
  const renderingEngine = createRenderingEngine(renderingEngineId);
  const viewport = setup2dViewport(renderingEngine, element, viewportId);
  setupViewer(toolGroupId, viewportId, renderingEngineId, volume2dModeConfig);
  await loadDicomStack(viewport, imageUrls);

  return { renderingEngine, viewport };
}
