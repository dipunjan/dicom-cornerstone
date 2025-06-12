const {
  StackConfig,
  VolumeConfig,
  ImageConfig,
} = require("../models/ViewerConfig");
const { serverConfig } = require("../config/appConfig");

const generateFilePath = (id, type) => {
  if (type === "stack") {
    return `/files/${id.toUpperCase()}.dcm`;
  } else if (type === "volume") {
    return `/files/${id}/`;
  } else if (type === "image") {
    return `/files/${id}.jpg`;
  }
  return null;
};
const createDefaultConfig = (fileInfo) => {
  if (!fileInfo) return null;

  const { baseUrl } = serverConfig;
  const { id, type } = fileInfo;

  const filePath = generateFilePath(id, type);
  if (!filePath) {
    throw new Error(`Cannot generate path for file type: ${type}`);
  }

  if (type === "stack") {
    return {
      id,
      viewer: {
        imageUrl: `wadouri:${baseUrl}${filePath}`,
        configs: {},
      },
    };
  } else if (type === "volume") {
    const volumeUrls = Array(291)
      .fill(0)
      .map((_, i) => {
        const paddedIndex = 1 + i;
        return `wadouri:${baseUrl}${filePath}3DSlice${paddedIndex}.dcm`;
      });

    return {
      id,
      viewer: {
        imageUrl: volumeUrls,
        configs: {},
      },
    };
  } else if (type === "image") {
    return {
      id,
      viewer: {
        imageUrl: `${baseUrl}${filePath}`,
        configs: {},
      },
    };
  }

  return null;
};

const createDataGetter = (ConfigModel, dataType) => {
  return async (id, fileInfo) => {
    try {
      let config = await ConfigModel.findOne({ id });
      if (!config) {
        const defaultConfig = createDefaultConfig(fileInfo);
        if (defaultConfig) {
          config = new ConfigModel(defaultConfig);
          await config.save();
        } else {
          throw new Error(`Cannot create config for file ID: ${id}`);
        }
      }
      return config.toObject();
    } catch (error) {
      console.error(
        `Error fetching ${dataType} data from MongoDB:`,
        error.message
      );
      throw error;
    }
  };
};

const createConfigUpdater = (ConfigModel, dataType, useFieldMapping = true) => {
  return async (id, configUpdates) => {
    try {
      let updateQuery;

      if (useFieldMapping) {
        const setFields = {};
        Object.keys(configUpdates).forEach((key) => {
          if (configUpdates[key] !== undefined) {
            setFields[`viewer.configs.${key}`] = configUpdates[key];
          }
        });
        updateQuery = { $set: setFields };
      } else {
        updateQuery = { $set: { "viewer.configs": configUpdates } };
      }

      const updatedConfig = await ConfigModel.findOneAndUpdate(
        { id },
        updateQuery,
        { new: true, upsert: true }
      );
      return updatedConfig.viewer.configs;
    } catch (error) {
      console.error(
        `Error updating ${dataType} config in MongoDB:`,
        error.message
      );
      throw error;
    }
  };
};

const getStackData = createDataGetter(StackConfig, "stack");
const updateStackConfig = createConfigUpdater(StackConfig, "stack");

const getVolumeData = createDataGetter(VolumeConfig, "volume");
const updateVolumeConfig = createConfigUpdater(VolumeConfig, "volume");

const getImageData = createDataGetter(ImageConfig, "image");
const updateImageConfig = createConfigUpdater(ImageConfig, "image", false);

module.exports = {
  getStackData,
  updateStackConfig,
  getVolumeData,
  updateVolumeConfig,
  getImageData,
  updateImageConfig,
};
