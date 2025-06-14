import { useEffect } from "react";
import { Types } from "@cornerstonejs/core";
import { annotation, ToolGroupManager } from "@cornerstonejs/tools";

interface UseViewerCleanupProps {
  renderingEngineRef: React.RefObject<Types.IRenderingEngine | null>;
  toolGroupId: string;
}

export function useViewerCleanup({
  renderingEngineRef,
  toolGroupId
}: UseViewerCleanupProps) {
  useEffect(() => {
    return () => {
      if (renderingEngineRef.current) {
        renderingEngineRef.current.destroy();
      }
      annotation.state.removeAllAnnotations();
      ToolGroupManager.destroyToolGroup(toolGroupId);
    };
  }, [toolGroupId]);
}
