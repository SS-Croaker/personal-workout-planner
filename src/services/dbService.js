import { doc, getDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { getFriendlyErrorMessage } from '../utils/errors';

const usersCollection = 'users';
const workoutPlansCollection = 'workoutPlans';
const DB_OPERATION_TIMEOUT_MS = 15000;

function userDoc(uid) {
  return doc(db, usersCollection, uid);
}

function workoutPlanDoc(uid) {
  return doc(db, workoutPlansCollection, uid);
}

async function withDbError(operation, fallback) {
  try {
    return await new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject(new Error('Saving the workout took too long. Please try again.'));
      }, DB_OPERATION_TIMEOUT_MS);

      operation()
        .then((value) => {
          window.clearTimeout(timeoutId);
          resolve(value);
        })
        .catch((error) => {
          window.clearTimeout(timeoutId);
          reject(error);
        });
    });
  } catch (error) {
    throw new Error(getFriendlyErrorMessage(error, fallback));
  }
}

export const dbService = {
  async bootstrapUserData(uid) {
    return withDbError(async () => {
      const [profileSnapshot, planSnapshot] = await Promise.all([
        getDoc(userDoc(uid)),
        getDoc(workoutPlanDoc(uid)),
      ]);

      return {
        profile: profileSnapshot.exists() ? profileSnapshot.data() : null,
        plan: planSnapshot.exists() ? planSnapshot.data() : null,
      };
    }, 'We could not load your training data right now.');
  },

  async saveProfile(uid, profile) {
    await withDbError(
      () => setDoc(
        userDoc(uid),
        {
          ...profile,
          updated_at: serverTimestamp(),
        },
        { merge: true },
      ),
      'We could not save your profile right now.',
    );
  },

  async saveProfileFields(uid, fields) {
    await withDbError(
      () => setDoc(
        userDoc(uid),
        {
          ...fields,
          updated_at: serverTimestamp(),
        },
        { merge: true },
      ),
      'We could not update your workout history right now.',
    );
  },

  async saveOnboardingState(uid, completed) {
    await dbService.saveProfileFields(uid, {
      onboarding_completed: Boolean(completed),
      onboarding_completed_at: serverTimestamp(),
    });
  },

  async saveProfileAndWorkoutPlans(uid, profile, workoutPlans) {
    await withDbError(async () => {
      const batch = writeBatch(db);

      batch.set(
        userDoc(uid),
        {
          ...profile,
          updated_at: serverTimestamp(),
        },
        { merge: true },
      );

      batch.set(workoutPlanDoc(uid), {
        ...workoutPlans,
        updated_at: serverTimestamp(),
      });

      await batch.commit();
    }, 'We could not save your workout plan right now.');
  },

  async saveWorkoutPlans(uid, workoutPlans) {
    await withDbError(
      () => setDoc(
        workoutPlanDoc(uid),
        {
          ...workoutPlans,
          updated_at: serverTimestamp(),
        },
        { merge: true },
      ),
      'We could not save your workout plan right now.',
    );
  },
};
