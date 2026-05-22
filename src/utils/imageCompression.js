import { debugLog } from './debug';

const MAX_FILE_BYTES = 500 * 1024;
export const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 1024;
const MIN_QUALITY = 0.55;
const IMAGE_PROCESSING_TIMEOUT_MS = 15000;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

function withTimeout(promise, timeoutMs, error) {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(error);
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((reason) => {
        window.clearTimeout(timeoutId);
        reject(reason);
      });
  });
}

function getFileExtension(file) {
  const parts = String(file?.name || '').toLowerCase().split('.');
  return parts.length > 1 ? parts.at(-1) : '';
}

function getSupportedMimeType(file) {
  const explicitType = String(file?.type || '').toLowerCase();
  if (SUPPORTED_IMAGE_TYPES.has(explicitType)) {
    return explicitType === 'image/jpg' ? 'image/jpeg' : explicitType;
  }

  switch (getFileExtension(file)) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return '';
  }
}

export function getSupportedImageInfo(file) {
  const contentType = getSupportedMimeType(file);

  if (!contentType) {
    return null;
  }

  const outputFormat = getOutputFormat(contentType);
  return {
    contentType,
    extension: outputFormat.extension,
  };
}

function getOutputFormat(mimeType) {
  if (mimeType === 'image/png') {
    return {
      contentType: 'image/png',
      extension: 'png',
      initialQuality: undefined,
      qualityStep: 0,
      minQuality: undefined,
    };
  }

  if (mimeType === 'image/webp') {
    return {
      contentType: 'image/webp',
      extension: 'webp',
      initialQuality: 0.9,
      qualityStep: 0.1,
      minQuality: MIN_QUALITY,
    };
  }

  return {
    contentType: 'image/jpeg',
    extension: 'jpg',
    initialQuality: 0.9,
    qualityStep: 0.1,
    minQuality: MIN_QUALITY,
  };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unsupported image format. Please use JPG, PNG, or WebP.'));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Image compression failed.'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

export async function compressImageFile(file) {
  const supportedImageInfo = getSupportedImageInfo(file);
  if (!supportedImageInfo) {
    throw new Error('Unsupported image format. Please use JPG, PNG, or WebP.');
  }
  const supportedMimeType = supportedImageInfo.contentType;

  debugLog('image-upload', 'Compression starting', {
    fileName: file?.name,
    fileType: file?.type || supportedMimeType,
    fileSize: file?.size,
  });

  const image = await withTimeout(
    loadImage(file),
    IMAGE_PROCESSING_TIMEOUT_MS,
    new Error('Image preparation took too long. Please try a smaller image.'),
  );
  const scale = Math.min(MAX_DIMENSION / image.width, MAX_DIMENSION / image.height, 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not supported in this browser.');
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const outputFormat = getOutputFormat(supportedMimeType);
  let quality = outputFormat.initialQuality;
  let blob = await withTimeout(
    canvasToBlob(canvas, outputFormat.contentType, quality),
    IMAGE_PROCESSING_TIMEOUT_MS,
    new Error('Image preparation took too long. Please try a smaller image.'),
  );

  while (
    blob.size > MAX_FILE_BYTES &&
    typeof quality === 'number' &&
    typeof outputFormat.minQuality === 'number' &&
    quality > outputFormat.minQuality
  ) {
    quality = Math.max(outputFormat.minQuality, quality - outputFormat.qualityStep);
    blob = await withTimeout(
      canvasToBlob(canvas, outputFormat.contentType, quality),
      IMAGE_PROCESSING_TIMEOUT_MS,
      new Error('Image preparation took too long. Please try a smaller image.'),
    );
  }

  if (blob.size > MAX_FILE_BYTES) {
    throw new Error('Image is still too large after compression. Try a smaller image.');
  }

  debugLog('image-upload', 'Compression complete', {
    outputType: outputFormat.contentType,
    outputSize: blob.size,
    width: canvas.width,
    height: canvas.height,
  });

  return {
    blob,
    contentType: outputFormat.contentType,
    extension: outputFormat.extension,
  };
}
