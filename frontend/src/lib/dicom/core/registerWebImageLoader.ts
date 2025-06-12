import { imageLoader, metaData, Types, Enums } from "@cornerstonejs/core";

/**
 * Register the web image loader with Cornerstone
 */
export function registerWebImageLoader(): void {
  // Register the loader
  imageLoader.registerImageLoader("web", webImageLoader as Types.ImageLoaderFn);

  // Add metadata provider for web images
  metaData.addProvider((type: string, imageId: string) => {
    if (!imageId.startsWith("web:")) {
      return;
    }

    // Basic metadata for all web images
    if (type === "imagePixelModule") {
      return {
        bitsAllocated: 8,
        bitsStored: 8,
        samplesPerPixel: 3, // RGB (changed from 4)
        highBit: 7, // Changed from 8 to 7 for 8-bit data
        photometricInterpretation: "RGB",
        pixelRepresentation: 0,
        planarConfiguration: 0,
      };
    }

    if (type === "generalSeriesModule") {
      return {
        modality: "SC",
        seriesNumber: 1,
        seriesDescription: "Web Image",
      };
    }
  });
}

type ImageLoaderResult = {
  promise: Promise<Record<string, unknown>>;
  cancelFn?: () => void;
  decache?: () => void;
};

/**
 * Web image loader function
 * @param imageId - The image ID to load (format: "web:http://example.com/image.jpg")
 * @returns Object with a promise that resolves to a Cornerstone image object
 */
function webImageLoader(imageId: string): ImageLoaderResult {
  return {
    promise: loadWebImage(imageId).then(
      (image) => image as unknown as Record<string, unknown>
    ),
  };
}

/**
 * Load a web image and convert it to a Cornerstone image object
 * @param imageId - The image ID to load
 * @returns Promise that resolves to a Cornerstone image object
 */
async function loadWebImage(imageId: string): Promise<Types.IImage> {
  // Extract the URL from the imageId (remove 'web:' prefix)
  const url = imageId.substring(4);

  // Create a new image element
  const image = new Image();
  image.crossOrigin = "anonymous";

  // Return a promise that resolves with the loaded image
  return new Promise((resolve, reject) => {
    image.onload = () => {
      try {
        // Create a canvas to draw the image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas 2D context"));
          return;
        }

        // Set canvas dimensions to match the image
        canvas.width = image.width;
        canvas.height = image.height;

        // Draw the image on the canvas
        ctx.drawImage(image, 0, 0);

        // Get the pixel data
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        const pixelData = imageData.data;

        // Ensure pixel data size is a multiple of 4 (RGBA)
        if (pixelData.length % 4 !== 0) {
          reject(new Error("Pixel data size is not a multiple of 4"));
          return;
        }

        // Convert RGBA to RGB for better GPU compatibility
        const rgbPixelData = new Uint8Array((pixelData.length / 4) * 3);
        for (let i = 0, j = 0; i < pixelData.length; i += 4, j += 3) {
          rgbPixelData[j] = pixelData[i];     // R
          rgbPixelData[j + 1] = pixelData[i + 1]; // G
          rgbPixelData[j + 2] = pixelData[i + 2]; // B
          // Skip alpha channel
        }

        // Create the Cornerstone image object
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
          rgba: false, // Changed to false since we're using RGB
          columnPixelSpacing: 1.0,
          rowPixelSpacing: 1.0,
          invert: false,
          sizeInBytes: rgbPixelData.length,
          preScale: {
            enabled: false, // Disable pre-scaling for web images
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
          numberOfComponents: 3, // Changed to 3 for RGB
          dataType: "Uint8Array",
        };

        resolve(cornerstoneImage);
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      reject(new Error(`Failed to load image from URL: ${url}`));
    };

    // Set the src to start loading the image
    image.src = url;
  });
}
