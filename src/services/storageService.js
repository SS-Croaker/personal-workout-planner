import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';
import { compressImageFile } from '../utils/imageCompression';

function sanitizeFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export const storageService = {
  async uploadExerciseImage(uid, dayNumber, exerciseName, file) {
    const compressedBlob = await compressImageFile(file);
    const fileName = `${Date.now()}-${sanitizeFileName(exerciseName || 'exercise')}.jpg`;
    const imageRef = ref(storage, `users/${uid}/workouts/day-${dayNumber}/${fileName}`);

    await uploadBytes(imageRef, compressedBlob, {
      contentType: 'image/jpeg',
      cacheControl: 'public,max-age=31536000,immutable',
    });

    return getDownloadURL(imageRef);
  },
};
