import {
  RenderingEngine,
  Types,
  Enums,
  volumeLoader,
} from "@cornerstonejs/core";
import { ViewportType } from "@cornerstonejs/core/enums";

export function createRenderingEngine(id: string) {
  return new RenderingEngine(id);
}

export interface ViewportConfig {
  viewportId: string;
  type: Enums.ViewportType;
  element: HTMLDivElement;
  background?: Types.Point3;
  orientation?: Enums.OrientationAxis;
}

export function setupViewport(
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

export function setup2dViewport(
  renderingEngine: RenderingEngine,
  element: HTMLDivElement,
  viewportId: string
): Types.IStackViewport {
  const config: ViewportConfig = {
    viewportId,
    type: ViewportType.STACK,
    element,
  };

  return setupViewport(renderingEngine, config) as Types.IStackViewport;
}

export function setup3dViewport(
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

  return setupViewport(renderingEngine, config) as Types.IVolumeViewport;
}

export async function loadDicomStack(
  viewport: Types.IStackViewport,
  imageIds: string | string[]
) {
  const ids = Array.isArray(imageIds) ? imageIds : [imageIds];
  await viewport.setStack(ids);
  viewport.render();
}

export async function loadDicomVolume(
  viewport: Types.IVolumeViewport,
  imageIds: string[],
  preset: string = "CT-Bone",
  volumeId: string
) {
  const volume = await volumeLoader.createAndCacheVolume(volumeId, {
    imageIds,
  });

  volume.load();
  await viewport.setVolumes([{ volumeId: volumeId }]);
  viewport.setProperties({ preset });
  viewport.render();

  return { volume, volumeId: volumeId };
}
