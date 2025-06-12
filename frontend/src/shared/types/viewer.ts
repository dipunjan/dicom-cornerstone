// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface DicomStackData {
  id: string;
  viewer: {
    imageUrl: string;
    configs: DicomStackConfig;
  };
}

export interface DicomVolumeData {
  id: string;
  viewer: {
    imageUrl: string[];
    configs: DicomVolumeConfig;
  };
}

export interface MedicalImageData {
  id: string;
  viewer: {
    imageUrl: string;
    configs: MedicalImageConfig;
  };
}

export interface DicomStackViewerProps {
  data: DicomStackData;
}

export interface DicomVolumeViewerProps {
  data: DicomVolumeData;
}

export interface MedicalImageViewerProps {
  data: MedicalImageData;
}

export interface DicomStackConfig {
  contrast: number;
  brightness: number;
  annotations?: AnnotationData[];
}

export interface DicomVolumeConfig {
  shift: number;
}

export interface MedicalImageConfig {
  brightness: number;
  contrast: number;
  annotations?: AnnotationData[];
}

export interface MedicalFileItem {
  id: string;
  name: string;
  type: "stack" | "volume" | "image";
}

export interface AnnotationData {
  annotationUID: string;
  toolName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  metadata: {
    viewportId?: string;
    frameOfReferenceUID?: string;
    referencedImageId?: string;
  };
}

export interface PatientDetails {
  patientId: string;
  patientName: string;
  files: MedicalFileItem[];
}
