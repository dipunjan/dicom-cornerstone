import {
  RenderingEngine,
  Types,
  Enums,
  volumeLoader,
} from "@cornerstonejs/core";

/**
 * Creates a new Cornerstone.js rendering engine instance
 */
export function createRenderingEngine(engineId: string): RenderingEngine {
  return new RenderingEngine(engineId);
}

/**
 * Configuration interface for viewport setup
 */
export interface ViewportConfig {
  viewportId: string;
  type: Enums.ViewportType;
  element: HTMLDivElement;
  background?: Types.Point3;
  orientation?: Enums.OrientationAxis;
}

/**
 * Creates and enables a viewport with the given configuration
 */
export function createViewport(
  renderingEngine: RenderingEngine,
  config: ViewportConfig
): Types.IViewport {
  const viewportInput: Types.PublicViewportInput = {
    viewportId: config.viewportId,
    type: config.type,
    element: config.element,
    defaultOptions: {
      background: config.background || ([0, 0, 0] as Types.Point3),
      ...(config.orientation && { orientation: config.orientation }),
    },
  };

  renderingEngine.enableElement(viewportInput);
  return renderingEngine.getViewport(config.viewportId);
}

/**
 * Creates a 2D stack viewport for single images or image stacks
 */
export function createStackViewport(
  renderingEngine: RenderingEngine,
  element: HTMLDivElement,
  viewportId: string
): Types.IStackViewport {
  const config: ViewportConfig = {
    viewportId,
    type: Enums.ViewportType.STACK,
    element,
  };

  return createViewport(renderingEngine, config) as Types.IStackViewport;
}

/**
 * Creates a 3D volume viewport for volumetric rendering
 */
export function createVolumeViewport(
  renderingEngine: RenderingEngine,
  element: HTMLDivElement,
  viewportId: string,
  orientation: Enums.OrientationAxis = Enums.OrientationAxis.CORONAL
): Types.IVolumeViewport {
  const config: ViewportConfig = {
    viewportId,
    type: Enums.ViewportType.VOLUME_3D,
    element,
    orientation,
  };

  return createViewport(renderingEngine, config) as Types.IVolumeViewport;
}

/**
 * Loads Stack images into 3D viewport
 */
export async function loadStackData(
  viewport: Types.IStackViewport,
  imageIds: string | string[]
): Promise<void> {
  const ids = Array.isArray(imageIds) ? imageIds : [imageIds];
  await viewport.setStack(ids);
  viewport.render();
}

/**
 * Loads Volume images into 3D viewport
 */
export async function loadVolumeData(
  viewport: Types.IVolumeViewport,
  imageIds: string[],
  volumeId: string,
  preset: string = "CT-Bone"
): Promise<{ volume: any; volumeId: string }> {
  const volume = await volumeLoader.createAndCacheVolume(volumeId, {
    imageIds,
  });

  volume.load();
  await viewport.setVolumes([{ volumeId }]);
  viewport.setProperties({ preset });
  viewport.render();

  return { volume, volumeId };
}
