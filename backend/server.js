const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { connectDatabase, isConnected } = require("./config/database");
const viewerService = require("./services/viewerService");
const { serverConfig, patientDetails } = require("./config/appConfig");

const app = express();
app.use(express.json({ limit: "50mb" })); // For JSON bodies
app.use(express.urlencoded({ limit: "50mb", extended: true }));
const PORT = serverConfig.port;

const QA_SAMPLES_PATH = "C:\\Users\\arpan\\Downloads\\files";

app.use(cors());
app.use(express.json());
app.use("/files", express.static(QA_SAMPLES_PATH));

const sendSuccess = (res, message, data) => {
  res.json({ success: true, message, data });
};

const sendError = (res, status, message, error = null) => {
  res.status(status).json({
    success: false,
    message,
    ...(error && { error: error.message }),
  });
};

const findFileById = (id) => {
  return patientDetails.files.find((f) => f.id === id);
};

app.get("/api/patient/:patientId/files", async (req, res) => {
  try {
    const { patientId } = req.params;

    if (patientId !== patientDetails.patientId) {
      return sendError(res, 404, `Patient with ID ${patientId} not found`);
    }

    sendSuccess(res, "Patient data fetched successfully", patientDetails);
  } catch (error) {
    sendError(res, 500, "Error fetching patient data", error);
  }
});

const createDataRoute = (path, serviceFn, dataType) => {
  return async (req, res) => {
    try {
      const { id } = req.params;
      const fileInfo = findFileById(id);

      if (!fileInfo) {
        return sendError(res, 404, `File with ID ${id} not found`);
      }

      const data = await serviceFn(id, fileInfo);
      sendSuccess(res, `${dataType} data fetched successfully`, data);
    } catch (error) {
      sendError(res, 500, `Error fetching ${dataType.toLowerCase()} data`, error);
    }
  };
};

app.get(
  "/api/dicom/stack/:id",
  createDataRoute("/api/dicom/stack/:id", viewerService.getStackData, "Stack")
);
app.get(
  "/api/dicom/volume/:id",
  createDataRoute("/api/dicom/volume/:id", viewerService.getVolumeData, "Volume")
);
app.get("/api/image/:id", createDataRoute("/api/image/:id", viewerService.getImageData, "Image"));

const createConfigRoute = (serviceFn, configType) => {
  return async (req, res) => {
    try {
      const { id } = req.params;
      const updatedConfigs = await serviceFn(id, req.body);
      sendSuccess(res, `${configType} viewer settings saved successfully`, updatedConfigs);
    } catch (error) {
      sendError(res, 500, `Error updating ${configType.toLowerCase()} config`, error);
    }
  };
};

app.patch(
  "/api/dicom/stack/:id/config",
  createConfigRoute(viewerService.updateStackConfig, "Stack")
);
app.patch(
  "/api/dicom/volume/:id/config",
  createConfigRoute(viewerService.updateVolumeConfig, "Volume")
);
app.patch("/api/image/:id/config", createConfigRoute(viewerService.updateImageConfig, "Image"));

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "CSOI Backend API is running",
    timestamp: new Date().toISOString(),
    database: {
      connected: isConnected(),
      type: isConnected() ? "MongoDB" : "In-Memory",
    },
    qaPath: QA_SAMPLES_PATH,
    pathExists: fs.existsSync(QA_SAMPLES_PATH),
  });
});

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`CSOI Backend API running on http://localhost:${PORT}`);
    console.log(`Serving files from: ${QA_SAMPLES_PATH}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Database: ${isConnected() ? "MongoDB (localhost:27017)" : "In-Memory Fallback"}`);

    if (!fs.existsSync(QA_SAMPLES_PATH)) {
      console.warn(`Warning: QASamples directory not found at ${QA_SAMPLES_PATH}`);
    } else {
      console.log(`QASamples directory found`);
    }
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
