import {
  ZoomTool,
  StackScrollTool,
  LengthTool,
  AngleTool,
  RectangleROITool,
  EllipticalROITool,
  BidirectionalTool,
  ArrowAnnotateTool,
  PlanarFreehandROITool,
  OrientationMarkerTool,
  MagnifyTool,
  addTool,
  ToolGroupManager,
  Enums as csToolsEnums,
} from "@cornerstonejs/tools";
import { applyMeasurementConfig } from "./toolMeasurementConfig";
import vtkOrientationMarkerWidget from "@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget";
import {
  FaSearchPlus,
  FaArrowsAlt,
  FaRuler,
  FaDrawPolygon,
  FaSquareFull,
  FaCircle,
  FaPencilAlt,
} from "react-icons/fa";

export const { MouseBindings: mouseBindings } = csToolsEnums;

export const toolConfig = [
  {
    tool: PlanarFreehandROITool,
    name: PlanarFreehandROITool.toolName,
    displayName: "Marker Tool",
    icon: FaPencilAlt,
  },
  {
    tool: ZoomTool,
    name: ZoomTool.toolName,
    displayName: "Zoom",
    icon: FaSearchPlus,
  },
  {
    tool: LengthTool,
    name: LengthTool.toolName,
    displayName: "Length",
    icon: FaRuler,
  },
  {
    tool: AngleTool,
    name: AngleTool.toolName,
    displayName: "Angle",
    icon: FaDrawPolygon,
  },
  {
    tool: RectangleROITool,
    name: RectangleROITool.toolName,
    displayName: "Rectangle",
    icon: FaSquareFull,
  },
  {
    tool: EllipticalROITool,
    name: EllipticalROITool.toolName,
    displayName: "Ellipse",
    icon: FaCircle,
  },
  {
    tool: ArrowAnnotateTool,
    name: ArrowAnnotateTool.toolName,
    displayName: "Arrow",
    icon: FaArrowsAlt,
  },
  {
    tool: MagnifyTool,
    name: MagnifyTool.toolName,
    displayName: "Magnify",
    icon: FaSearchPlus,
  },
];

type ToolClass =
  | typeof ZoomTool
  | typeof StackScrollTool
  | typeof LengthTool
  | typeof AngleTool
  | typeof RectangleROITool
  | typeof EllipticalROITool
  | typeof BidirectionalTool
  | typeof ArrowAnnotateTool
  | typeof PlanarFreehandROITool
  | typeof MagnifyTool;

type VolumeToolClass = ToolClass | typeof OrientationMarkerTool;

export interface ToolBinding {
  tool: ToolClass;
  bindings: { mouseButton: number }[];
}

export interface VolumeToolBinding {
  tool: VolumeToolClass;
  bindings: { mouseButton: number }[];
}

export interface ViewerConfig {
  tools: ToolClass[];
  bindings: ToolBinding[];
}

export interface VolumeViewerConfig {
  tools: VolumeToolClass[];
  bindings: VolumeToolBinding[];
}

const magnifyConfig = {
  magnifySize: 5,
  magnificationLevel: 2,
};

const orientationMarkerConfig = {
  overlayMarkerType: OrientationMarkerTool.OVERLAY_MARKER_TYPES.ANNOTATED_CUBE,
  orientationWidget: {
    viewportCorner: vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT,
  },
  overlayConfiguration: {
    [OrientationMarkerTool.OVERLAY_MARKER_TYPES.ANNOTATED_CUBE]: {
      faceProperties: {
        xPlus: {
          text: "L",
          faceColor: "#333333",
          fontColor: "white",
          faceRotation: 90,
          edgeColor: "#333333",
        },
        xMinus: {
          text: "R",
          faceColor: "#333333",
          fontColor: "white",
          faceRotation: 270,
          edgeColor: "#333333",
        },
        yPlus: {
          text: "P",
          faceColor: "#333333",
          fontColor: "white",
          faceRotation: 180,
          edgeColor: "#333333",
        },
        yMinus: {
          text: "A",
          faceColor: "#333333",
          fontColor: "white",
          edgeColor: "#333333",
        },
        zPlus: {
          text: "H",
          faceColor: "#333333",
          edgeColor: "#333333",
          fontColor: "white",
        },
        zMinus: {
          text: "F",
          faceColor: "#333333",
          edgeColor: "#333333",
          fontColor: "white",
          faceRotation: 180,
        },
      },
    },
  },
};

export function setupViewer(
  toolGroupId: string,
  viewportId: string,
  renderingEngineId: string,
  config: ViewerConfig | VolumeViewerConfig
) {
  config.tools.forEach((tool) => addTool(tool));

  let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
  if (!toolGroup) {
    toolGroup = ToolGroupManager.createToolGroup(toolGroupId)!;
  }
  toolGroup.addViewport(viewportId, renderingEngineId);

  config.tools.forEach((tool) => {
    if (tool === OrientationMarkerTool) {
      toolGroup.addTool(tool.toolName, orientationMarkerConfig);
      toolGroup.setToolEnabled(tool.toolName);
    } else if (tool === MagnifyTool) {
      toolGroup.addTool(tool.toolName, magnifyConfig);
    } else {
      const measurementConfig = applyMeasurementConfig(tool.toolName);
      toolGroup.addTool(tool.toolName, measurementConfig);
    }
  });

  config.bindings.forEach(({ tool, bindings }) => {
    toolGroup.setToolActive(tool.toolName, { bindings });
  });
}

export const stackViewerConfig: ViewerConfig = {
  tools: toolConfig.map((config) => config.tool),
  bindings: [],
};

export const volumeViewerConfig: VolumeViewerConfig = {
  tools: [ZoomTool, OrientationMarkerTool],
  bindings: [
    {
      tool: ZoomTool,
      bindings: [{ mouseButton: mouseBindings.Wheel }],
    },
  ],
};

export const volume2dModeConfig: ViewerConfig = {
  tools: [ZoomTool, StackScrollTool],
  bindings: [
    {
      tool: StackScrollTool,
      bindings: [{ mouseButton: mouseBindings.Wheel }],
    },
  ],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toolRegistry: any = {};
toolConfig.forEach((config) => {
  toolRegistry[config.name] = config.tool;
});

export function setPrimaryTool(toolName: string, viewportId: string) {
  const toolGroup = ToolGroupManager.getToolGroupForViewport(viewportId);
  if (!toolGroup) return;

  const tool = toolRegistry[toolName];
  if (!tool) return;

  if (!toolGroup.hasTool(toolName)) return;

  toolConfig.forEach((config) => {
    toolGroup.setToolPassive(config.name);
  });

  toolGroup.setToolActive(toolName, {
    bindings: [{ mouseButton: mouseBindings.Primary }],
  });

  stackViewerConfig.bindings = stackViewerConfig.bindings.filter(
    (b) => b.bindings[0].mouseButton !== mouseBindings.Primary
  );

  stackViewerConfig.bindings.push({
    tool,
    bindings: [{ mouseButton: mouseBindings.Primary }],
  });
}

/**
 * Handle tool selection with state management
 */
export function handleToolSelection(
  toolName: string,
  viewportId: string,
  setActiveTool: (tool: string | null) => void
): void {
  setPrimaryTool(toolName, viewportId);
  setActiveTool(toolName);
}
