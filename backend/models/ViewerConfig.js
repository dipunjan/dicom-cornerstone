const mongoose = require("mongoose");

const stackConfigSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: "stackFile",
    },
    viewer: {
      imageUrl: {
        type: String,
        required: true,
      },
      configs: {
        contrast: {
          type: Number,
          default: 1,
        },
        brightness: {
          type: Number,
          default: 1,
        },
        annotations: {
          type: [
            {
              annotationUID: String,
              toolName: String,
              data: mongoose.Schema.Types.Mixed,
              metadata: {
                viewportId: String,
                frameOfReferenceUID: String,
                referencedImageId: String,
              },
            },
          ],
          default: [],
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

const volumeConfigSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: "volumeFile",
    },
    viewer: {
      imageUrl: [
        {
          type: String,
          required: true,
        },
      ],
      configs: {
        shift: {
          type: Number,
          default: 400,
        },
        annotations: {
          type: [
            {
              annotationUID: String,
              toolName: String,
              data: mongoose.Schema.Types.Mixed,
              metadata: {
                viewportId: String,
                frameOfReferenceUID: String,
                referencedImageId: String,
              },
            },
          ],
          default: [],
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

const imageConfigSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: "imageFile",
    },
    viewer: {
      imageUrl: {
        type: String,
        required: true,
      },
      configs: {
        contrast: {
          type: Number,
          default: 1,
        },
        brightness: {
          type: Number,
          default: 1,
        },
        annotations: {
          type: [
            {
              annotationUID: String,
              toolName: String,
              data: mongoose.Schema.Types.Mixed,
              metadata: {
                viewportId: String,
                frameOfReferenceUID: String,
                referencedImageId: String,
              },
            },
          ],
          default: [],
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

const StackConfig = mongoose.model("StackConfig", stackConfigSchema);
const VolumeConfig = mongoose.model("VolumeConfig", volumeConfigSchema);
const ImageConfig = mongoose.model("ImageConfig", imageConfigSchema);

module.exports = {
  StackConfig,
  VolumeConfig,
  ImageConfig,
};
