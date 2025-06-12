import { useEffect } from "react";
import { Types } from "@cornerstonejs/core";

export function useViewportResize(
  renderingEngineRef: React.RefObject<Types.IRenderingEngine | null>,
  viewportId: string,
  isInitialized: boolean
): void {
  useEffect(() => {
    const handleResize = () => {
      if (renderingEngineRef.current && isInitialized) {
        renderingEngineRef.current.resize();
        const viewport = renderingEngineRef.current.getViewport(viewportId);
        if (viewport) {
          viewport.render();
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderingEngineRef, viewportId, isInitialized]);
}
