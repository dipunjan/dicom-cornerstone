import { annotation, ToolGroupManager } from "@cornerstonejs/tools";
import type { AnnotationData } from "@/shared/types";
import type { Types } from "@cornerstonejs/core";
import { toolConfig } from "./dicomAnnotationControl";

export function getViewportAnnotations(viewportId: string): AnnotationData[] {
  const element = document.querySelector(`[data-viewport-uid="${viewportId}"]`) as HTMLDivElement;
  if (!element) return [];

  const viewportAnnotations: AnnotationData[] = [];

  toolConfig.forEach(({ name: toolName }) => {
    const toolAnnotations = annotation.state.getAnnotations(toolName, element);

    if (Array.isArray(toolAnnotations)) {
      toolAnnotations.forEach((ann) => {
        if (ann?.annotationUID) {
          viewportAnnotations.push({
            annotationUID: ann.annotationUID,
            toolName,
            data: ann.data,
            metadata: {
              viewportId,
              frameOfReferenceUID: ann.metadata?.FrameOfReferenceUID,
              referencedImageId: ann.metadata?.referencedImageId,
            },
          });
        }
      });
    }
  });

  return viewportAnnotations;
}

export function restoreViewportAnnotations(
  annotations: AnnotationData[],
  viewportId: string,
  viewport: Types.IStackViewport | Types.IVolumeViewport
): void {
  if (!Array.isArray(annotations) || annotations.length === 0) return;

  const element = document.querySelector(`[data-viewport-uid="${viewportId}"]`) as HTMLDivElement;
  if (!element) return;

  // Restore annotations
  annotations.forEach((annotationData) => {
    const restoredAnnotation = {
      annotationUID: annotationData.annotationUID,
      data: annotationData.data,
      metadata: {
        ...annotationData.metadata,
        viewportId,
        toolName: annotationData.toolName,
      },
      highlighted: false,
      invalidated: false,
    };

    annotation.state.addAnnotation(restoredAnnotation, element);
  });

  // Enable annotation tools so they become visible
  const toolGroup = ToolGroupManager.getToolGroupForViewport(viewportId);
  if (toolGroup) {
    const toolNames = [...new Set(annotations.map((ann) => ann.toolName))];
    toolNames.forEach((toolName) => {
      if (toolGroup.hasTool(toolName)) {
        toolGroup.setToolEnabled(toolName);
      }
    });
  }

  viewport.render();
}
