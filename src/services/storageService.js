import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase';
import { compressImageFile } from '../utils/imageCompression';
import { getFriendlyErrorMessage } from '../utils/errors';
import { debugLog } from '../utils/debug';

const IMAGE_UPLOAD_TIMEOUT_MS = 25000;

function sanitizeFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function uploadBlobWithTimeout(imageRef, filePayload, metadata) {
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(imageRef, filePayload, metadata);
    const timeoutId = window.setTimeout(() => {
      debugLog('image-upload', 'Upload timed out and was cancelled', {
        path: imageRef.fullPath,
      });
      uploadTask.cancel();
      reject(new Error('Image upload took too long. Please try again.'));
    }, IMAGE_UPLOAD_TIMEOUT_MS);

    uploadTask.on(
      'state_changed',
      undefined,
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
      () => {
        window.clearTimeout(timeoutId);
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

      const { blob, contentType, extension } = await compressImageFile(file);
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
