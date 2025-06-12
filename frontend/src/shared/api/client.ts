import axios from "axios";
import type {
  ApiResponse,
  DicomStackData,
  DicomVolumeData,
  MedicalImageData,
  DicomStackConfig,
  DicomVolumeConfig,
  MedicalImageConfig,
  PatientDetails,
} from "@/shared/types";

const baseUrl = import.meta.env.VITE_DICOM_BASE_URL;

const api = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

const handleApiGet = async <T>(
  url: string,
  errorMessage: string
): Promise<T | null> => {
  try {
    const response = await api.get<ApiResponse<T>>(url);
    return response.data.data;
  } catch (error) {
    console.error(errorMessage, error);
    return null;
  }
};

export async function apiGetStackData(
  id: string
): Promise<DicomStackData | null> {
  return handleApiGet<DicomStackData>(
    `/api/dicom/stack/${id}`,
    "Error fetching stack data:"
  );
}

export async function apiGetVolumeData(
  id: string
): Promise<DicomVolumeData | null> {
  return handleApiGet<DicomVolumeData>(
    `/api/dicom/volume/${id}`,
    "Error fetching volume data:"
  );
}

export async function apiGetImageData(
  id: string
): Promise<MedicalImageData | null> {
  return handleApiGet<MedicalImageData>(
    `/api/image/${id}`,
    "Error fetching image data:"
  );
}

export async function apiGetFileList(
  patientId: string
): Promise<PatientDetails | null> {
  return handleApiGet<PatientDetails>(
    `/api/patient/${patientId}/files`,
    "Error fetching patient files:"
  );
}

const handleApiSave = async <T>(
  url: string,
  configs: T,
  successMessage: string,
  errorMessage: string
): Promise<void> => {
  try {
    await api.patch<ApiResponse<T>>(url, configs);
    console.log(successMessage);
  } catch (error) {
    console.error(errorMessage, error);
  }
};

export async function saveStackConfig(
  id: string,
  configs: DicomStackConfig
): Promise<void> {
  return handleApiSave(
    `/api/dicom/stack/${id}/config`,
    configs,
    "Stack settings saved successfully",
    "Error saving stack config:"
  );
}

export async function saveVolumeConfig(
  id: string,
  configs: DicomVolumeConfig
): Promise<void> {
  return handleApiSave(
    `/api/dicom/volume/${id}/config`,
    configs,
    "Volume settings saved successfully",
    "Error saving volume config:"
  );
}

export async function saveImageConfig(
  id: string,
  configs: MedicalImageConfig
): Promise<void> {
  return handleApiSave(
    `/api/image/${id}/config`,
    configs,
    "Image settings saved successfully",
    "Error saving image config:"
  );
}
