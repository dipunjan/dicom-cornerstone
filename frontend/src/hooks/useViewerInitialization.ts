import { useState, useEffect } from "react";
import { cache } from "@cornerstonejs/core";
import { annotation, ToolGroupManager } from "@cornerstonejs/tools";
import { initializeCornerstone } from "@/lib/dicom/core/dicomCornerstoneInit";
import { registerWebImageLoader } from "@/lib/dicom/core/registerWebImageLoader";

interface UseViewerInitializationProps {
  toolGroupId: string;
  needsWebImageLoader?: boolean;
}

export function useViewerInitialization({ 
  toolGroupId, 
  needsWebImageLoader = false 
}: UseViewerInitializationProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      initializeCornerstone();

      if (needsWebImageLoader) {
        registerWebImageLoader();
        setTimeout(() => {
          setIsInitialized(true);
        }, 100);
      } else {
        setIsInitialized(true);
      }
    };

    initialize();

    return () => {
      annotation.state.removeAllAnnotations();
      ToolGroupManager.destroyToolGroup(toolGroupId);
      cache.purgeCache();
    };
  }, [toolGroupId, needsWebImageLoader]);

  return { isInitialized };
}
