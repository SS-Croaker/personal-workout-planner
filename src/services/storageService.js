import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase';
import { MAX_UPLOAD_FILE_BYTES, compressImageFile, getSupportedImageInfo } from '../utils/imageCompression';
import { getFriendlyErrorMessage } from '../utils/errors';
import { debugLog } from '../utils/debug';

const IMAGE_UPLOAD_TIMEOUT_MS = 25000;

function sanitizeFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function uploadBlobWithTimeout(imageRef, filePayload, metadata) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const uploadTask = uploadBytesResumable(imageRef, filePayload, metadata);
    let timeoutId = 0;

    const clearUploadTimeout = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };

    const startUploadTimeout = () => {
      clearUploadTimeout();
      timeoutId = window.setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        debugLog('image-upload', 'Upload timed out and was cancelled', {
          path: imageRef.fullPath,
        });
        uploadTask.cancel();
        reject(new Error('Connection issue during upload. Please try again.'));
      }, IMAGE_UPLOAD_TIMEOUT_MS);
    };

    startUploadTimeout();

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        debugLog('image-upload', 'Upload progress', {
          path: imageRef.fullPath,
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          state: snapshot.state,
        });
        startUploadTimeout();
      },
      (error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearUploadTimeout();
        reject(error);
      },
      () => {
        if (settled) {
          return;
        }
        settled = true;
        clearUploadTimeout();
        resolve(uploadTask.snapshot.ref);
      },
    );
  });
}

export const storageService = {
  async uploadExerciseImage(uid, dayNumber, exerciseName, file) {
    try {
      debugLog('image-upload', 'Upload starting', {
        uid,
        dayNumber,
        exerciseName,
        fileName: file?.name,
        fileType: file?.type,
        fileSize: file?.size,
      });

      const supportedImageInfo = getSupportedImageInfo(file);
      if (!supportedImageInfo) {
        throw new Error('Unsupported image format. Please use JPG, PNG, or WebP.');
      }

      let uploadPayload;
      try {
        uploadPayload = await compressImageFile(file);
      } catch (compressionError) {
        debugLog('image-upload', 'Compression failed, falling back to original file', compressionError);
        if (file.size > MAX_UPLOAD_FILE_BYTES) {
          throw new Error('That image is too large. Please choose an image under 10 MB.');
        }

        uploadPayload = {
          blob: file,
          contentType: supportedImageInfo.contentType,
          extension: supportedImageInfo.extension,
        };
      }

      const { blob, contentType, extension } = uploadPayload;
      const fileName = `${Date.now()}-${sanitizeFileName(exerciseName || 'exercise')}.${extension}`;
      const imageRef = ref(storage, `users/${uid}/workouts/day-${dayNumber}/${fileName}`);

      const uploadedRef = await uploadBlobWithTimeout(imageRef, blob, {
        contentType,
        cacheControl: 'public,max-age=31536000,immutable',
      });
      debugLog('image-upload', 'Upload complete', {
        path: uploadedRef.fullPath,
        contentType,
        size: blob.size,
      });

      const downloadUrl = await getDownloadURL(uploadedRef);
      debugLog('image-upload', 'Download URL created');
      return downloadUrl;
    } catch (error) {
      debugLog('image-upload', 'Upload failed', error);
      throw new Error(getFriendlyErrorMessage(error, 'We could not upload that image right now.'));
    }
  },
};
