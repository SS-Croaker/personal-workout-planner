import { doc, getDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

const usersCollection = 'users';
const workoutPlansCollection = 'workoutPlans';

function userDoc(uid) {
  return doc(db, usersCollection, uid);
}

function workoutPlanDoc(uid) {
  return doc(db, workoutPlansCollection, uid);
}

export const dbService = {
  async bootstrapUserData(uid) {
    const [profileSnapshot, planSnapshot] = await Promise.all([
      getDoc(userDoc(uid)),
      getDoc(workoutPlanDoc(uid)),
    ]);

    return {
      profile: profileSnapshot.exists() ? profileSnapshot.data() : null,
      plan: planSnapshot.exists() ? planSnapshot.data() : null,
    };
  },

  async saveProfile(uid, profile) {
    await setDoc(
      userDoc(uid),
      {
        ...profile,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
  },

  async saveOnboardingState(uid, completed) {
    await setDoc(
      userDoc(uid),
      {
        onboarding_completed: Boolean(completed),
        onboarding_completed_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
  },

  async saveProfileAndWorkoutPlans(uid, profile, workoutPlans) {
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
  },

  async saveWorkoutPlans(uid, workoutPlans) {
    await setDoc(
      workoutPlanDoc(uid),
      {
        ...workoutPlans,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
  },
};
