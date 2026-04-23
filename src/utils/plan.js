export const EXERCISE_TYPES = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'recovery', label: 'Recovery' },
];

export const EXERCISE_EQUIPMENT = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'cables', label: 'Cables' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'kettlebells', label: 'Kettlebells' },
  { value: 'machine', label: 'Machine' },
  { value: 'sandbag', label: 'Sandbag' },
  { value: 'plate', label: 'Plate' },
];

export const WEIGHT_UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'lbs', label: 'lbs' },
];

export function normalizeExerciseCompletion(completed) {
  return Boolean(completed);
}

export function normalizeExerciseType(type) {
  switch ((type || '').toLowerCase()) {
    case 'strength':
      return 'strength';
    case 'cardio':
      return 'cardio';
    case 'recovery':
      return 'recovery';
    case 'hypertrophy':
      return 'strength';
    case 'mobility':
      return 'recovery';
    default:
      return 'strength';
  }
}

export function getExerciseTypeLabel(type) {
  const normalizedType = normalizeExerciseType(type);
  return EXERCISE_TYPES.find((option) => option.value === normalizedType)?.label || 'Strength';
}

export function normalizeExerciseEquipment(equipment) {
  switch ((equipment || '').toLowerCase()) {
    case 'barbell':
      return 'barbell';
    case 'bodyweight':
      return 'bodyweight';
    case 'cables':
      return 'cables';
    case 'dumbbells':
      return 'dumbbells';
    case 'kettlebells':
      return 'kettlebells';
    case 'machine':
      return 'machine';
    case 'sandbag':
      return 'sandbag';
    case 'plate':
      return 'plate';
    default:
      return '';
  }
}

export function getExerciseEquipmentLabel(equipment) {
  const normalizedEquipment = normalizeExerciseEquipment(equipment);
  return EXERCISE_EQUIPMENT.find((option) => option.value === normalizedEquipment)?.label || 'Not set';
}

export function normalizeWeightUnit(unit) {
  switch ((unit || '').toLowerCase()) {
    case 'lbs':
      return 'lbs';
    case 'kg':
    default:
      return 'kg';
  }
}

export function formatExerciseWeight(weight, weightUnit) {
  const numericWeight = Number(weight) || 0;
  const normalizedWeightUnit = normalizeWeightUnit(weightUnit);
  return `${numericWeight} ${normalizedWeightUnit}`;
}

export function createEmptyExercise() {
  return {
    name: '',
    type: normalizeExerciseType('strength'),
    equipment: '',
    weight: '',
    weight_unit: normalizeWeightUnit('kg'),
    completed: normalizeExerciseCompletion(false),
    image_url: '',
  };
}

export function normalizeExercise(exercise) {
  return {
    ...exercise,
    type: normalizeExerciseType(exercise?.type),
    equipment: normalizeExerciseEquipment(exercise?.equipment),
    weight_unit: normalizeWeightUnit(exercise?.weight_unit),
    completed: normalizeExerciseCompletion(exercise?.completed),
  };
}

export function createEmptyPlanDays(daysPerWeek) {
  return Array.from({ length: daysPerWeek }, (_, index) => ({
    day_number: index + 1,
    exercises: [],
  }));
}

function createPlanId() {
  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createPlanRecord({ userId, name, daysPerWeek, id = createPlanId(), createdAt = new Date().toISOString() }) {
  return {
    id,
    user_id: userId,
    name: name?.trim() || 'Workout Plan',
    created_at: createdAt,
    is_active: true,
    days_per_week: daysPerWeek,
    days: createEmptyPlanDays(daysPerWeek),
  };
}

export function normalizePlan(plan) {
  if (!plan) {
    return null;
  }

  return {
    ...plan,
    days: Array.isArray(plan.days)
      ? plan.days.map((day) => ({
          ...day,
          exercises: Array.isArray(day.exercises)
            ? day.exercises.map((exercise) => normalizeExercise(exercise))
            : [],
        }))
      : [],
  };
}

function applyActiveFlag(plans, activePlanId) {
  return plans.map((plan) => ({
    ...plan,
    is_active: plan.id === activePlanId,
  }));
}

export function normalizeWorkoutPlansDoc(workoutPlansDoc, uid) {
  if (!workoutPlansDoc) {
    return {
      plans: [],
      activePlanId: null,
      activePlan: null,
    };
  }

  const rawPlans = Array.isArray(workoutPlansDoc.plans) ? workoutPlansDoc.plans : [workoutPlansDoc];
  const normalizedPlans = rawPlans
    .map((plan) => normalizePlan(plan))
    .filter(Boolean)
    .map((plan) => ({
      ...plan,
      id: plan.id || createPlanId(),
      user_id: plan.user_id || uid,
      name: plan.name?.trim() || 'Workout Plan',
      created_at: plan.created_at || new Date().toISOString(),
      is_active: Boolean(plan.is_active),
    }));

  const requestedActivePlanId = workoutPlansDoc.active_plan_id;
  const fallbackActivePlanId =
    normalizedPlans.find((plan) => plan.id === requestedActivePlanId)?.id ||
    normalizedPlans.find((plan) => plan.is_active)?.id ||
    normalizedPlans[0]?.id ||
    null;

  const plans = applyActiveFlag(normalizedPlans, fallbackActivePlanId);

  return {
    plans,
    activePlanId: fallbackActivePlanId,
    activePlan: plans.find((plan) => plan.id === fallbackActivePlanId) || null,
  };
}

export function buildWorkoutPlansPayload(plans, activePlanId) {
  const normalizedPlans = applyActiveFlag(plans.map((plan) => normalizePlan(plan)), activePlanId);

  return {
    active_plan_id: activePlanId,
    plans: normalizedPlans,
  };
}
