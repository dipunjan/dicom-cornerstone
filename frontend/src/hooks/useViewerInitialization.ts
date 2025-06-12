import { useState, useEffect } from "react";
import { cache } from "@cornerstonejs/core";
import { annotation } from "@cornerstonejs/tools";
import { initializeCornerstone } from "@/lib/dicom/core/dicomCornerstoneInit";
import { registerWebImageLoader } from "@/lib/dicom/core/registerWebImageLoader";

interface UseViewerInitializationProps {
  needsWebImageLoader?: boolean;
}

export function useViewerInitialization({
  needsWebImageLoader = false
}: UseViewerInitializationProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      initializeCornerstone();

      if (needsWebImageLoader) {
        registerWebImageLoader();
        setIsInitialized(true);
      } else {
        setIsInitialized(true);
      }
    };

    initialize();

    return () => {
      annotation.state.removeAllAnnotations();
      cache.purgeCache();
    };
  }, [needsWebImageLoader]);

  return { isInitialized };
}
