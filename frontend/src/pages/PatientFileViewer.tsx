import { useState, Suspense } from "react";
import { useLoaderData } from "react-router-dom";
import type {
  MedicalFileItem,
  PatientDetails,
  DicomStackData,
  DicomVolumeData,
  MedicalImageData,
} from "@/shared/types";
import {
  apiGetStackData,
  apiGetVolumeData,
  apiGetImageData,
} from "@/shared/api";

import { lazy } from "react";
const StackViewer = lazy(() => import("@/components/viewers/StackViewer"));
const VolumeViewer = lazy(() => import("@/components/viewers/VolumeViewer"));
const ImageViewer = lazy(() => import("@/components/viewers/ImageViewer"));

export default function PatientFileViewer() {
  const patientData = useLoaderData() as PatientDetails;
  const [selectedFile, setSelectedFile] = useState<MedicalFileItem | null>(
    null
  );
  const [viewerData, setViewerData] = useState<
    DicomStackData | DicomVolumeData | MedicalImageData | null
  >(null);
  const [loading, setLoading] = useState(false);

  const handleFileClick = async (file: MedicalFileItem) => {
    setSelectedFile(file);
    setLoading(true);
    if (file.type === "image") {
      setViewerData(await apiGetImageData(file.id));
    } else if (file.type === "volume") {
      setViewerData(await apiGetVolumeData(file.id));
    } else if (file.type === "stack") {
      setViewerData(await apiGetStackData(file.id));
    }

    setLoading(false);
  };

  const renderViewer = () => {
    if (!selectedFile || !viewerData) return null;

    if (selectedFile.type === "image") {
      return (
        <ImageViewer
          key={selectedFile.id}
          data={viewerData as MedicalImageData}
        />
      );
    } else if (selectedFile.type === "volume") {
      return (
        <VolumeViewer
          key={selectedFile.id}
          data={viewerData as DicomVolumeData}
        />
      );
    } else if (selectedFile.type === "stack") {
      return (
        <StackViewer
          key={selectedFile.id}
          data={viewerData as DicomStackData}
        />
      );
    }
  };

  return (
    <div className="patient-viewer">
      <div className="file-list">
        <div className="patient-header">
          <h3>{patientData.patientName}</h3>
          <div className="patient-details">
            <span>ID: {patientData.patientId}</span>
          </div>
        </div>

        <div className="file-list-header">
          <h4>Files</h4>
          <span className="file-count">{patientData.files.length} files</span>
        </div>

        <div className="file-items">
          {patientData.files.map((file) => (
            <div
              key={file.id}
              className={`file-item ${
                selectedFile?.id === file.id ? "selected" : ""
              }`}
              onClick={() => handleFileClick(file)}
            >
              <div className="file-name">{file.name}</div>
              <div className="file-type">{file.type}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="viewer-panel">
        {!selectedFile ? (
          <div className="empty-state">
            <h3>Select a file to view</h3>
            <p>Choose a file from the list to load it in the viewer</p>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <h3>Loading {selectedFile.name}...</h3>
          </div>
        ) : viewerData ? (
          <Suspense
            fallback={
              <div className="loading-state">
                <h3>Initializing viewer...</h3>
              </div>
            }
          >
            {renderViewer()}
          </Suspense>
        ) : (
          <div className="error-state">
            <h3>Failed to load file</h3>
            <p>Could not load {selectedFile.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
