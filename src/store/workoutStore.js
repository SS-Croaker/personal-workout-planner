import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { dbService } from '../services/dbService';
import { storageService } from '../services/storageService';
import {
  buildWorkoutPlansPayload,
  createPlanRecord,
  normalizeExercise,
  normalizeExerciseEquipment,
  normalizeExerciseType,
  normalizeWorkoutTitle,
  normalizeWeightUnit,
  normalizeWorkoutPlansDoc,
} from '../utils/plan';

export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      profile: null,
      plans: [],
      activePlanId: null,
      plan: null,
      sessionUid: null,
      bootstrapped: false,
      hydratedThisSession: false,
      loading: false,

      hydrateFromCloud: async (uid, forceRefresh = false) => {
        const state = get();

        if (!forceRefresh && state.sessionUid === uid && state.bootstrapped && state.hydratedThisSession) {
          return;
        }

        set({ loading: true });

        try {
          const data = await dbService.bootstrapUserData(uid);
          const normalizedWorkoutPlans = normalizeWorkoutPlansDoc(data.plan, uid);
          set({
            profile: data.profile,
            plans: normalizedWorkoutPlans.plans,
            activePlanId: normalizedWorkoutPlans.activePlanId,
            plan: normalizedWorkoutPlans.activePlan,
            sessionUid: uid,
            bootstrapped: true,
            hydratedThisSession: true,
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      saveProfile: async (uid, profile) => {
        await dbService.saveProfile(uid, profile);
        set({
          profile,
          sessionUid: uid,
          bootstrapped: true,
          hydratedThisSession: true,
        });
      },

      createPlan: async (uid, planName, daysPerWeek) => {
        const currentProfile = get().profile;
        const currentPlans = get().plans;
        const nextPlan = createPlanRecord({
          userId: uid,
          name: planName,
          daysPerWeek,
        });
        const nextPlans = [...currentPlans, nextPlan];
        const payload = buildWorkoutPlansPayload(nextPlans, nextPlan.id);

        if (currentProfile) {
          await dbService.saveProfileAndWorkoutPlans(uid, currentProfile, payload);
        } else {
          await dbService.saveWorkoutPlans(uid, payload);
        }

        set({
          plans: payload.plans,
          activePlanId: nextPlan.id,
          plan: payload.plans.find((plan) => plan.id === nextPlan.id) || nextPlan,
          sessionUid: uid,
          bootstrapped: true,
          hydratedThisSession: true,
        });
      },

      saveWorkoutDay: async (uid, dayNumber, exercises, workoutTitle) => {
        const currentPlan = get().plan;
        const currentPlans = get().plans;
        const activePlanId = get().activePlanId;
        if (!currentPlan) {
          throw new Error('Workout plan not found.');
        }

        const nextDays = [];

        for (const day of currentPlan.days) {
          if (day.day_number !== dayNumber) {
            nextDays.push(day);
            continue;
          }

          const nextExercises = [];
          for (const exercise of exercises) {
            if (!exercise.name && !exercise.weight && !exercise.image_url && !exercise.imageFile) {
              continue;
            }

            let imageUrl = exercise.image_url || '';
            if (exercise.imageFile) {
              imageUrl = await storageService.uploadExerciseImage(uid, dayNumber, exercise.name, exercise.imageFile);
            }

            nextExercises.push({
              name: exercise.name,
              type: normalizeExerciseType(exercise.type),
              equipment: normalizeExerciseEquipment(exercise.equipment),
              weight: Number(exercise.weight) || 0,
              weight_unit: normalizeWeightUnit(exercise.weight_unit),
              completed: Boolean(exercise.completed),
              image_url: imageUrl,
            });
          }

          nextDays.push({
            ...day,
            title: normalizeWorkoutTitle(workoutTitle, dayNumber),
            exercises: nextExercises,
          });
        }

        const nextPlan = {
          ...currentPlan,
          days: nextDays,
        };
        const nextPlans = currentPlans.map((plan) => (plan.id === currentPlan.id ? nextPlan : plan));
        const payload = buildWorkoutPlansPayload(nextPlans, activePlanId);

        await dbService.saveWorkoutPlans(uid, payload);
        set({
          plans: payload.plans,
          activePlanId,
          plan: payload.plans.find((plan) => plan.id === activePlanId) || nextPlan,
          sessionUid: uid,
          bootstrapped: true,
          hydratedThisSession: true,
        });
      },

      toggleExerciseCompletion: async (uid, dayNumber, exerciseIndex, completed) => {
        const currentPlan = get().plan;
        const currentPlans = get().plans;
        const activePlanId = get().activePlanId;
        if (!currentPlan) {
          throw new Error('Workout plan not found.');
        }

        const previousPlan = currentPlan;
        const previousPlans = currentPlans;
        const nextPlan = {
          ...currentPlan,
          days: currentPlan.days.map((day) => {
            if (day.day_number !== dayNumber) {
              return day;
            }

            return {
              ...day,
              exercises: day.exercises.map((exercise, index) =>
                index === exerciseIndex
                  ? normalizeExercise({
                      ...exercise,
                      completed,
                    })
                  : exercise,
              ),
            };
          }),
        };
        const nextPlans = currentPlans.map((plan) => (plan.id === currentPlan.id ? nextPlan : plan));
        const payload = buildWorkoutPlansPayload(nextPlans, activePlanId);

        set({
          plans: payload.plans,
          activePlanId,
          plan: payload.plans.find((plan) => plan.id === activePlanId) || nextPlan,
          sessionUid: uid,
          bootstrapped: true,
          hydratedThisSession: true,
        });

        try {
          await dbService.saveWorkoutPlans(uid, payload);
        } catch (error) {
          set({
            plans: previousPlans,
            activePlanId,
            plan: previousPlan,
            sessionUid: uid,
            bootstrapped: true,
            hydratedThisSession: true,
          });
          throw error;
        }
      },

      resetPlanProgress: async (uid) => {
        const currentPlan = get().plan;
        const currentPlans = get().plans;
        const activePlanId = get().activePlanId;
        if (!currentPlan) {
          throw new Error('Workout plan not found.');
        }

        const previousPlan = currentPlan;
        const previousPlans = currentPlans;
        const nextPlan = {
          ...currentPlan,
          days: currentPlan.days.map((day) => ({
            ...day,
            exercises: day.exercises.map((exercise) =>
              normalizeExercise({
                ...exercise,
                completed: false,
              }),
            ),
          })),
        };
        const nextPlans = currentPlans.map((plan) => (plan.id === currentPlan.id ? nextPlan : plan));
        const payload = buildWorkoutPlansPayload(nextPlans, activePlanId);

        set({
          plans: payload.plans,
          activePlanId,
          plan: payload.plans.find((plan) => plan.id === activePlanId) || nextPlan,
          sessionUid: uid,
          bootstrapped: true,
          hydratedThisSession: true,
        });

        try {
          await dbService.saveWorkoutPlans(uid, payload);
        } catch (error) {
          set({
            plans: previousPlans,
            activePlanId,
            plan: previousPlan,
            sessionUid: uid,
            bootstrapped: true,
            hydratedThisSession: true,
          });
          throw error;
        }
      },

      switchActivePlan: async (uid, nextActivePlanId) => {
        const currentPlans = get().plans;
        const currentActivePlanId = get().activePlanId;
        const nextActivePlan = currentPlans.find((plan) => plan.id === nextActivePlanId);

        if (!nextActivePlan) {
          throw new Error('Selected workout plan not found.');
        }

        const previousPlans = currentPlans;
        const payload = buildWorkoutPlansPayload(currentPlans, nextActivePlanId);

        set({
          plans: payload.plans,
          activePlanId: nextActivePlanId,
          plan: payload.plans.find((plan) => plan.id === nextActivePlanId) || nextActivePlan,
          sessionUid: uid,
          bootstrapped: true,
          hydratedThisSession: true,
        });

        try {
          await dbService.saveWorkoutPlans(uid, payload);
        } catch (error) {
          const rollback = buildWorkoutPlansPayload(previousPlans, currentActivePlanId);
          set({
            plans: rollback.plans,
            activePlanId: currentActivePlanId,
            plan: rollback.plans.find((plan) => plan.id === currentActivePlanId) || null,
            sessionUid: uid,
            bootstrapped: true,
            hydratedThisSession: true,
          });
          throw error;
        }
      },

      deletePlan: async (uid, planId) => {
        const currentPlans = get().plans;
        const currentActivePlanId = get().activePlanId;
        const planToDelete = currentPlans.find((plan) => plan.id === planId);

        if (!planToDelete) {
          throw new Error('Workout plan not found.');
        }

        const previousPlans = currentPlans;
        const previousActivePlanId = currentActivePlanId;
        const nextPlans = currentPlans.filter((plan) => plan.id !== planId);
        const fallbackActivePlanId =
          currentActivePlanId === planId
            ? nextPlans[0]?.id || null
            : currentActivePlanId;
        const payload = buildWorkoutPlansPayload(nextPlans, fallbackActivePlanId);

        set({
          plans: payload.plans,
          activePlanId: fallbackActivePlanId,
          plan: payload.plans.find((plan) => plan.id === fallbackActivePlanId) || null,
          sessionUid: uid,
          bootstrapped: true,
          hydratedThisSession: true,
        });

        try {
          await dbService.saveWorkoutPlans(uid, payload);
        } catch (error) {
          const rollback = buildWorkoutPlansPayload(previousPlans, previousActivePlanId);
          set({
            plans: rollback.plans,
            activePlanId: previousActivePlanId,
            plan: rollback.plans.find((plan) => plan.id === previousActivePlanId) || null,
            sessionUid: uid,
            bootstrapped: true,
            hydratedThisSession: true,
          });
          throw error;
        }
      },

      clearWorkoutState: () =>
        set({
          profile: null,
          plans: [],
          activePlanId: null,
          plan: null,
          sessionUid: null,
          bootstrapped: false,
          hydratedThisSession: false,
          loading: false,
        }),
    }),
    {
      name: 'gym-workout-cache-v1',
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        profile: state.profile,
        plans: state.plans,
        activePlanId: state.activePlanId,
        plan: state.plan,
        sessionUid: state.sessionUid,
        bootstrapped: state.bootstrapped,
      }),
    },
  ),
);
