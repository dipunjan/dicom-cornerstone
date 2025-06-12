import { imageLoader, metaData, Types, Enums } from "@cornerstonejs/core";

export function registerWebImageLoader(): void {
  imageLoader.registerImageLoader("web", webImageLoader as Types.ImageLoaderFn);

  metaData.addProvider((imageId: string) => {
    if (!imageId.startsWith("web:")) return;
    return {
      bitsAllocated: 8,
      bitsStored: 8,
      samplesPerPixel: 3,
      highBit: 7,
      photometricInterpretation: "RGB",
      pixelRepresentation: 0,
      planarConfiguration: 0,
    };
  });
}

type ImageLoaderResult = {
  promise: Promise<Record<string, unknown>>;
  cancelFn?: () => void;
  decache?: () => void;
};

function webImageLoader(imageId: string): ImageLoaderResult {
  return {
    promise: loadWebImage(imageId).then(
      (image) => image as unknown as Record<string, unknown>
    ),
  };
}

async function loadWebImage(imageId: string): Promise<Types.IImage> {
  const url = imageId.substring(4);
  const image = new Image();
  image.crossOrigin = "anonymous";

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas 2D context"));
        return;
      }

      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      const imageData = ctx.getImageData(0, 0, image.width, image.height);
      const pixelData = imageData.data;

      if (pixelData.length % 4 !== 0) {
        reject(new Error("Pixel data size is not a multiple of 4"));
        return;
      }

      const rgbPixelData = new Uint8Array((pixelData.length / 4) * 3);
      for (let i = 0, j = 0; i < pixelData.length; i += 4, j += 3) {
        rgbPixelData[j] = pixelData[i];
        rgbPixelData[j + 1] = pixelData[i + 1];
        rgbPixelData[j + 2] = pixelData[i + 2];
      }

      const cornerstoneImage: Types.IImage = {
        imageId,
        minPixelValue: 0,
        maxPixelValue: 255,
        slope: 1.0,
        intercept: 0,
        windowCenter: 127,
        windowWidth: 255,
        getPixelData: () => rgbPixelData,
        rows: image.height,
        columns: image.width,
        height: image.height,
        width: image.width,
        color: true,
        rgba: false,
        columnPixelSpacing: 1.0,
        rowPixelSpacing: 1.0,
        invert: false,
        sizeInBytes: rgbPixelData.length,
        preScale: {
          enabled: false,
          scaled: false,
          scalingParameters: {
            modality: undefined,
            rescaleSlope: 1.0,
            rescaleIntercept: 0,
            suvbw: undefined,
          },
        },
        render: undefined,
        stats: {},
        getCanvas: () => canvas,
        cachedLut: undefined,
        voiLUTFunction: Enums.VOILUTFunctionType.LINEAR,
        numberOfComponents: 3,
        dataType: "Uint8Array",
      };

      resolve(cornerstoneImage);
    };

    image.onerror = () => {
      reject(new Error(`Failed to load image from URL: ${url}`));
    };

    image.src = url;
  });
}
