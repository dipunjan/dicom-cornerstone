# CSOI Medical Imaging Frontend

## Code Structure

```
frontend/
├── src/
│   ├── shared/
│   │   ├── api/
│   │   │   ├── client.ts            # Centralized API with error handling
│   │   │   └── index.ts             # API exports
│   │   ├── constants/
│   │   │   ├── dicom.ts             # DICOM viewer constants
│   │   │   └── index.ts             # Constants exports
│   │   └── types/
│   │       ├── viewer.ts            # TypeScript interfaces
│   │       └── index.ts             # Type exports
│   ├── dicom-viewer/
│   │   ├── components/viewers/
│   │   │   ├── StackViewer.tsx      # 2D DICOM viewer
│   │   │   └── VolumeViewer.tsx     # 3D DICOM viewer with mode switching
│   │   ├── config/                  # DICOM image controls
│   │   └── core/                    # Cornerstone.js initialization
│   ├── image-viewer/
│   │   ├── components/viewers/
│   │   │   └── ImageViewer.tsx      # Fabric.js image viewer
│   │   ├── config/                  # Image adjustment controls
│   │   └── core/                    # Fabric.js canvas management
│   ├── layouts/
│   │   └── RootLayout.tsx           # Main app layout
│   ├── pages/
│   │   ├── Home.tsx                 # Home page with patient selection
│   │   └── PatientFileViewer.tsx    # Patient file browser and viewer
│   ├── routes.tsx                   # React Router with data loaders
│   ├── styles.scss                  # Global styles
│   └── main.tsx                     # App entry point
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## API Architecture

### Centralized Error Handling

All API functions handle errors internally and return simplified responses:

- **GET functions**: Return `DataType | null`
- **SAVE functions**: Return `Promise<void>`
- **Error logging**: Automatic console logging for all failures
- **No try-catch needed**: Components just use the returned data

### API Functions

#### Data Fetching

```typescript
// Returns patient data or null
apiGetFileList(patientId: string): Promise<PatientDetails | null>

// Returns viewer data or null
apiGetStackData(id: string): Promise<DicomStackData | null>
apiGetVolumeData(id: string): Promise<DicomVolumeData | null>
apiGetImageData(id: string): Promise<MedicalImageData | null>
```

#### Configuration Saving

```typescript
// All return Promise<void> with internal error handling
saveStackConfig(id: string, configs: DicomStackConfig): Promise<void>
saveVolumeConfig(id: string, configs: DicomVolumeConfig): Promise<void>
saveImageConfig(id: string, configs: MedicalImageConfig): Promise<void>
```

### Data Types

#### Patient Data

```typescript
PatientDetails = {
  patientId: string;              // "P001"
  patientName: string;            // "John Doe"
  files: MedicalFileItem[];       // Array of available files
}

MedicalFileItem = {
  id: string;                     // "h1", "d3d", "painting"
  name: string;                   // "2D Stack", "3D Volume Series"
  type: "stack" | "volume" | "image";
}
```

#### Viewer Data

```typescript
DicomStackData = {
  id: string;
  viewer: {
    imageUrl: string;             // Single DICOM file URL
    configs: {
      contrast: number;           // 0.1 - 3.0
      brightness: number;         // 0.1 - 3.0
    };
  };
}

DicomVolumeData = {
  id: string;
  viewer: {
    imageUrl: string[];           // Array of DICOM file URLs
    configs: {
      shift: number;              // 0 - 3000
    };
  };
}

MedicalImageData = {
  id: string;
  viewer: {
    imageUrl: string;             // Image file URL
    configs: {
      brightness: number;         // -100 to 100
      contrast: number;           // -100 to 100
      saturation: number;         // -100 to 100
      rotation: number;           // 0 to 360
    };
  };
}
```

## Component Usage

### Route Loader

```typescript
// routes.tsx
loader: async ({ params }) => {
  const { patientId } = params as { patientId: string };
  return await apiGetFileList(patientId); // Returns data or null
};
```

### Data Loading in Components

```typescript
// PatientFileViewer.tsx
const handleFileClick = async (file: MedicalFileItem) => {
  if (file.type === "image") {
    setViewerData(await apiGetImageData(file.id));
  }
  // API handles all errors, returns data or null
};
```

### Saving Configurations

```typescript
// Stack viewer includes annotation saving
const handleSave = async () => {
  await saveStackConfig(data.id, { contrast, brightness, annotations });
  // No response checking needed - API handles everything
};

// Volume viewer only saves shift (no annotations)
const handleSave = async () => {
  await saveVolumeConfig(data.id, { shift });
  // No response checking needed - API handles everything
};
```

### Annotation Management

```typescript
// Annotation tools are only available in StackViewer (2D DICOM)
// VolumeViewer (3D DICOM) does not support annotations
// ArrowAnnotateTool, LengthTool, AngleTool, etc. are supported in StackViewer
import {
  getViewportAnnotations,
  restoreViewportAnnotations,
} from "@/dicom-viewer";

// Annotations are automatically captured and restored in StackViewer only
```

## Data Flow

1. **Route Load**: React Router calls `apiGetFileList()` → Returns patient data or null
2. **File Selection**: User clicks file → Component calls appropriate API → Returns viewer data or null
3. **Viewer Render**: Component passes data to viewer → Viewer initializes with saved settings
4. **Settings Change**: User adjusts controls → Real-time updates to viewer
5. **Settings Save**: User clicks save → API call with internal error handling
