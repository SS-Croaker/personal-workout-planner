import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';
import { MAX_UPLOAD_FILE_BYTES, getSupportedImageInfo } from '../utils/imageCompression';
import { getFriendlyErrorMessage } from '../utils/errors';
import { debugLog } from '../utils/debug';

let bucketHealthPromise = null;

function sanitizeFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function buildImagePath(uid, dayNumber, exerciseName, extension) {
  const fileName = `${Date.now()}-${sanitizeFileName(exerciseName || 'exercise')}.${extension}`;
  return `users/${uid}/workouts/day-${dayNumber}/${fileName}`;
}

function createUploadError(code, message, cause) {
  const error = new Error(message);
  error.code = code;
  if (cause) {
    error.cause = cause;
  }
  return error;
}

async function verifyStorageBucket(debugContext = {}) {
  const storageBucket = String(storage.app.options.storageBucket || '').trim();
  console.log('STORAGE LIST PROBE CALLER', {
    component: debugContext?.component || 'unknown',
    traceId: debugContext?.traceId || '',
    exerciseName: debugContext?.exerciseName || '',
    storageBucket,
  });

  if (!storageBucket) {
    throw createUploadError(
      'storage/invalid-config',
      'Workout image uploads are not available right now. Firebase Storage is not configured.',
    );
  }

  if (!bucketHealthPromise) {
    bucketHealthPromise = (async () => {
      const probeUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o?maxResults=1`;
      console.log('STORAGE LIST PROBE URL', probeUrl);

      debugLog('image-upload', 'Storage bucket health check starting', {
        ...debugContext,
        storageBucket,
        probeUrl,
      });

      let response;

      try {
        response = await fetch(probeUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-store',
        });
      } catch (error) {
        debugLog('image-upload', 'Storage bucket health check failed', {
          ...debugContext,
          storageBucket,
          code: error?.code,
          message: error?.message,
          name: error?.name,
        });
        throw createUploadError(
          'storage/bucket-unreachable',
          'We could not reach Firebase Storage right now. Please try again in a moment.',
          error,
        );
      }

      debugLog('image-upload', 'Storage bucket health check completed', {
        ...debugContext,
        storageBucket,
        status: response.status,
        ok: response.ok,
      });

      if (response.status === 404) {
        throw createUploadError(
          'storage/bucket-not-found',
          'Workout image uploads are not available right now. The Firebase Storage bucket could not be found.',
        );
      }

      if (!response.ok && response.status !== 401 && response.status !== 403) {
        throw createUploadError(
          'storage/bucket-unreachable',
          'We could not reach Firebase Storage right now. Please try again in a moment.',
        );
      }

      return storageBucket;
    })().catch((error) => {
      bucketHealthPromise = null;
      throw error;
    });
  }

  return bucketHealthPromise;
}

async function uploadOriginalImage(uid, dayNumber, exerciseName, file, debugContext = {}) {
  const supportedImageInfo = getSupportedImageInfo(file);

  debugLog('image-upload', 'Raw upload validation starting', {
    ...debugContext,
    uid,
    dayNumber,
    exerciseName,
    fileName: file?.name,
    fileType: file?.type,
    fileSize: file?.size,
    storageBucket: storage.app.options.storageBucket,
  });

  if (!supportedImageInfo) {
    const error = new Error('Unsupported image format. Please use JPG, PNG, or WebP.');
    error.code = 'upload/invalid-image-type';
    throw error;
  }

  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    const error = new Error('That image is too large. Please choose an image under 10 MB.');
    error.code = 'upload/image-too-large';
    throw error;
  }

  await verifyStorageBucket(debugContext);

  const imagePath = buildImagePath(uid, dayNumber, exerciseName, supportedImageInfo.extension);
  const imageRef = ref(storage, imagePath);
  const metadata = {
    contentType: supportedImageInfo.contentType,
    cacheControl: 'public,max-age=31536000,immutable',
  };

  debugLog('image-upload', 'Firebase upload starting', {
    ...debugContext,
    imagePath,
    contentType: metadata.contentType,
    fileSize: file.size,
  });

  const snapshot = await uploadBytes(imageRef, file, metadata);

  debugLog('image-upload', 'Firebase upload completed', {
    ...debugContext,
    imagePath: snapshot.metadata.fullPath,
    uploadedSize: snapshot.metadata.size,
    generation: snapshot.metadata.generation,
    md5Hash: snapshot.metadata.md5Hash,
  });

  debugLog('image-upload', 'Download URL request starting', {
    ...debugContext,
    imagePath: snapshot.metadata.fullPath,
  });

  const downloadUrl = await getDownloadURL(snapshot.ref);
  console.log('DOWNLOAD URL', downloadUrl);

  debugLog('image-upload', 'Download URL created', {
    ...debugContext,
    imagePath: snapshot.metadata.fullPath,
    hasDownloadUrl: Boolean(downloadUrl),
  });

  return {
    downloadUrl,
    imagePath: snapshot.metadata.fullPath,
  };
}

export const storageService = {
  async uploadExerciseImage(uid, dayNumber, exerciseName, file, debugContext = {}) {
    try {
      debugLog('image-upload', 'Upload pipeline entered', {
        ...debugContext,
        uid,
        dayNumber,
        exerciseName,
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file?.size,
      });
      debugLog('image-upload', 'Compression bypassed for reliability', {
        ...debugContext,
        reason: 'raw-upload-debugging',
      });

      const { downloadUrl } = await uploadOriginalImage(uid, dayNumber, exerciseName, file, debugContext);
      return downloadUrl;
    } catch (error) {
      debugLog('image-upload', 'Upload failed', {
        ...debugContext,
        code: error?.code,
        message: error?.message,
        name: error?.name,
      });
      const wrappedError = new Error(getFriendlyErrorMessage(error, 'We could not upload that image right now.'));
      wrappedError.code = error?.code;
      wrappedError.cause = error;
      throw wrappedError;
    }
  },

  async debugDirectUpload(uid, dayNumber, exerciseName, file, debugContext = {}) {
    return uploadOriginalImage(uid, dayNumber, exerciseName, file, debugContext);
  },
};
