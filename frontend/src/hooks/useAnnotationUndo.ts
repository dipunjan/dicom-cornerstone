import { useRef, useEffect, useState } from "react";
import { eventTarget } from "@cornerstonejs/core";
import { annotation, Enums } from "@cornerstonejs/tools";

interface UseAnnotationUndoProps {
  viewportId: string;
  isInitialized: boolean;
  savedAnnotations?: any[];
}

export function useAnnotationUndo({ 
  viewportId, 
  isInitialized, 
  savedAnnotations = [] 
}: UseAnnotationUndoProps) {
  const annotationHistoryRef = useRef<string[]>([]);
  const savedAnnotationsRef = useRef<any[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    if (savedAnnotations.length > 0) {
      savedAnnotationsRef.current = savedAnnotations.map((ann: any) => ({
        annotationUID: ann.annotationUID
      }));
    }
  }, [savedAnnotations]);

  useEffect(() => {
    if (!isInitialized) return;

    const handleAnnotationAdded = (event: any) => {
      const annotationData = event.detail.annotation;
      const eventViewportId = event.detail.viewportId;
      
      if (annotationData && eventViewportId === viewportId) {
        const isSavedAnnotation = savedAnnotationsRef.current.some(saved => 
          saved.annotationUID === annotationData.annotationUID
        );
        
        if (!isSavedAnnotation) {
          annotationHistoryRef.current.push(annotationData.annotationUID);
          setCanUndo(true);
        }
      }
    };

    eventTarget.addEventListener(Enums.Events.ANNOTATION_ADDED, handleAnnotationAdded);

    return () => {
      eventTarget.removeEventListener(Enums.Events.ANNOTATION_ADDED, handleAnnotationAdded);
    };
  }, [isInitialized, viewportId]);

  const undo = (viewport: any) => {
    if (annotationHistoryRef.current.length === 0 || !viewport) return;

    const lastAnnotationUID = annotationHistoryRef.current.pop();
    
    if (lastAnnotationUID) {
      annotation.state.removeAnnotation(lastAnnotationUID);
      viewport.render();
      setCanUndo(annotationHistoryRef.current.length > 0);
    }
  };

  const clearHistory = () => {
    annotationHistoryRef.current = [];
    setCanUndo(false);
  };

  const updateSavedAnnotations = (annotations: any[]) => {
    savedAnnotationsRef.current = annotations.map((ann: any) => ({
      annotationUID: ann.annotationUID
    }));
    clearHistory();
  };

  return {
    canUndo,
    undo,
    clearHistory,
    updateSavedAnnotations
  };
}
