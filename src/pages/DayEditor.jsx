import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import ExerciseEditor from '../components/ExerciseEditor';
import { useAuthStore } from '../store/authStore';
import { useFeedbackStore } from '../store/feedbackStore';
import { useWorkoutStore } from '../store/workoutStore';
import {
  createEmptyExercise,
  formatExerciseWeight,
  getExerciseEquipmentLabel,
  getExerciseTypeLabel,
} from '../utils/plan';

const COMMON_EXERCISES = [
  'Barbell Back Squat',
  'Barbell Front Squat',
  'Bench Press',
  'Incline Dumbbell Press',
  'Overhead Press',
  'Deadlift',
  'Romanian Deadlift',
  'Pull-Up',
  'Lat Pulldown',
  'Barbell Row',
  'Seated Cable Row',
  'Dumbbell Shoulder Press',
  'Lateral Raise',
  'Bicep Curl',
  'Hammer Curl',
  'Tricep Pushdown',
  'Skull Crusher',
  'Leg Press',
  'Leg Extension',
  'Leg Curl',
  'Walking Lunge',
  'Hip Thrust',
  'Calf Raise',
  'Chest Fly',
  'Cable Crossover',
  'Face Pull',
  'Plank',
  'Hanging Leg Raise',
  'Russian Twist',
  'Mountain Climbers',
  'Burpees',
  'Treadmill Run',
  'Cycling',
  'Rowing Machine',
];

export default function DayEditor() {
  const { dayNumber } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const plan = useWorkoutStore((state) => state.plan);
  const saveWorkoutDay = useWorkoutStore((state) => state.saveWorkoutDay);
  const showToast = useFeedbackStore((state) => state.showToast);
  const parsedDayNumber = Number(dayNumber);
  const selectedDay = useMemo(
    () => plan?.days.find((day) => day.day_number === parsedDayNumber),
    [parsedDayNumber, plan],
  );
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pendingScrollIndex, setPendingScrollIndex] = useState(null);
  const exerciseRefs = useRef([]);
  const exerciseSuggestions = useMemo(
    () =>
      draft?.exercises.map((exercise) => {
        const query = exercise.name.trim().toLowerCase();
        if (!query) {
          return COMMON_EXERCISES.slice(0, 10);
        }

        return COMMON_EXERCISES.filter((suggestion) => suggestion.toLowerCase().includes(query)).slice(0, 8);
      }) || [],
    [draft],
  );
  const lastUsedWeightHints = useMemo(
    () =>
      draft?.exercises.map((exercise, index) => {
        const normalizedName = exercise.name?.trim().toLowerCase();

        if (!normalizedName || !plan?.days) {
          return '';
        }

        const matchingExercises = plan.days.flatMap((day) =>
          (day.exercises || []).filter((candidate, candidateIndex) => {
            if (day.day_number === parsedDayNumber && candidateIndex === index) {
              return false;
            }

            return candidate.name?.trim().toLowerCase() === normalizedName && Number(candidate.weight) > 0;
          }),
        );

        const lastMatch = matchingExercises.at(-1);
        return lastMatch ? formatExerciseWeight(lastMatch.weight, lastMatch.weight_unit) : '';
      }) || [],
    [draft, parsedDayNumber, plan?.days],
  );

  useEffect(() => {
    if (selectedDay) {
      setDraft({
        day_number: selectedDay.day_number,
        exercises: selectedDay.exercises.map((exercise) => ({ ...exercise })),
      });
      return;
    }

    setDraft(null);
  }, [selectedDay]);

  useEffect(() => {
    if (pendingScrollIndex === null) {
      return;
    }

    const targetExercise = exerciseRefs.current[pendingScrollIndex];
    if (!targetExercise) {
      return;
    }

    targetExercise.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    const firstInput = targetExercise.querySelector('input, select, textarea');
    firstInput?.focus({ preventScroll: true });

    setPendingScrollIndex(null);
  }, [draft?.exercises.length, pendingScrollIndex]);

  if (!plan) {
    return <Navigate to="/create-plan" replace />;
  }

  if (!Number.isFinite(parsedDayNumber) || !selectedDay) {
    return <Navigate to="/" replace />;
  }

  if (!draft) {
    return (
      <section className="page-section">
        <div className="panel">
          <h3>Getting Workout {selectedDay.day_number} ready...</h3>
          <p className="muted">Pulling everything into place so you can keep building.</p>
        </div>
      </section>
    );
  }

  const updateExerciseField = (index, field, value) => {
    setDraft((current) => {
      const exercises = current.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index ? { ...exercise, [field]: value } : exercise,
      );
      return { ...current, exercises };
    });
  };

  const updateExerciseImage = (index, file) => {
    if (!file) {
      return;
    }

    setDraft((current) => {
      const exercises = current.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index
          ? {
              ...exercise,
              imageFile: file,
              pendingImageName: file.name,
            }
          : exercise,
      );
      return { ...current, exercises };
    });
  };

  const addExercise = () => {
    const nextIndex = draft.exercises.length;
    setDraft((current) => ({
      ...current,
      exercises: [...current.exercises, createEmptyExercise()],
    }));
    setPendingScrollIndex(nextIndex);
  };

  const removeExercise = (index) => {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.filter((_, exerciseIndex) => exerciseIndex !== index),
    }));
  };

  const handleSave = async () => {
    setError('');

    const partialExerciseIndex = draft.exercises.findIndex((exercise) => {
      const hasAnyInput =
        exercise.name?.trim() ||
        exercise.weight !== '' ||
        exercise.equipment ||
        exercise.image_url ||
        exercise.imageFile;

      return hasAnyInput && !exercise.name?.trim();
    });

    if (partialExerciseIndex !== -1) {
      setError(`Add a name for exercise ${partialExerciseIndex + 1} before you save.`);
      return;
    }

    const invalidWeightIndex = draft.exercises.findIndex(
      (exercise) => exercise.weight !== '' && Number(exercise.weight) < 0,
    );

    if (invalidWeightIndex !== -1) {
      setError(`Check the weight for exercise ${invalidWeightIndex + 1} and try again.`);
      return;
    }

    setSaving(true);

    try {
      await saveWorkoutDay(user.uid, draft.day_number, draft.exercises);
      showToast({
        type: 'success',
        message: `Workout ${draft.day_number} is saved and ready.`,
      });
      navigate(`/day/${draft.day_number}`, { replace: true });
    } catch (saveError) {
      const message = saveError.message || 'We couldn’t save your workout right now.';
      setError(message);
      showToast({
        type: 'error',
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Workout Editor</p>
          <h2>Workout {selectedDay.day_number}</h2>
        </div>
        <p className="muted">
          Build out this workout, dial in the details, and save when everything looks right.
        </p>
      </div>

      <div className="editor-toolbar">
        <Link to={`/day/${selectedDay.day_number}`} className="secondary-button inline-button">
          Back to Workout View
        </Link>
      </div>

      <div className="stack-list">
        {draft.exercises.map((exercise, index) => (
          <div
            key={`exercise-${index}`}
            className="stack-list exercise-entry"
            ref={(node) => {
              exerciseRefs.current[index] = node;
            }}
          >
            <ExerciseEditor
              exercise={exercise}
              index={index}
              suggestions={exerciseSuggestions[index] || COMMON_EXERCISES.slice(0, 10)}
              lastUsedWeightHint={lastUsedWeightHints[index]}
              onChange={updateExerciseField}
              onImageChange={updateExerciseImage}
              onRemove={removeExercise}
            />
            <p className="helper-text">
              Focus: {getExerciseTypeLabel(exercise.type)} | Equipment: {getExerciseEquipmentLabel(exercise.equipment)} | Weight: {formatExerciseWeight(exercise.weight, exercise.weight_unit)}
            </p>
          </div>
        ))}

        {draft.exercises.length === 0 ? (
          <div className="panel empty-state">
            <h3>Start building your workout</h3>
            <p className="muted">Add your first exercise to get this session moving.</p>
          </div>
        ) : null}

        <div className="add-exercise-footer">
          <button type="button" className="secondary-button add-exercise-button" onClick={addExercise}>
            Add Exercise
          </button>
        </div>
      </div>

      {error ? <p className="feedback-inline feedback-error">{error}</p> : null}

      {saving ? <p className="feedback-inline feedback-info">Saving your workout...</p> : null}

      <button type="button" className="primary-button" disabled={saving} onClick={handleSave}>
        {saving ? 'Saving your workout...' : 'Save Workout'}
      </button>
    </section>
  );
}
