import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import ExerciseEditor from '../components/ExerciseEditor';
import { useAuthStore } from '../store/authStore';
import { useFeedbackStore } from '../store/feedbackStore';
import { useWorkoutStore } from '../store/workoutStore';
import {
  createEmptyExercise,
  formatExerciseWeight,
  normalizeWorkoutTitle,
  WORKOUT_NAME_SUGGESTIONS,
} from '../utils/plan';
import { debugLog } from '../utils/debug';

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

const SUPPORTED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024;

function isSupportedImageFile(file) {
  const mimeType = String(file?.type || '').toLowerCase();
  if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mimeType)) {
    return true;
  }

  const extension = String(file?.name || '').toLowerCase().split('.').at(-1);
  return SUPPORTED_IMAGE_EXTENSIONS.has(extension);
}

function normalizeSuggestionValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function dedupeSuggestions(values) {
  const seen = new Set();
  const unique = [];

  values.forEach((value) => {
    const normalizedValue = normalizeSuggestionValue(value);
    if (!normalizedValue) {
      return;
    }

    const lookupKey = normalizedValue.toLowerCase();
    if (seen.has(lookupKey)) {
      return;
    }

    seen.add(lookupKey);
    unique.push(normalizedValue);
  });

  return unique;
}

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
  const suggestionPool = useMemo(() => {
    const planExerciseNames =
      plan?.days?.flatMap((day) =>
        (day.exercises || []).map((exercise) => normalizeSuggestionValue(exercise?.name)),
      ) || [];

    return dedupeSuggestions([...COMMON_EXERCISES, ...planExerciseNames]);
  }, [plan?.days]);
  const exerciseSuggestions = useMemo(
    () =>
      draft?.exercises.map((exercise) => {
        const query = normalizeSuggestionValue(exercise?.name).toLowerCase();
        if (!query) {
          return suggestionPool.slice(0, 10);
        }

        return suggestionPool
          .filter((suggestion) => suggestion.toLowerCase().includes(query))
          .slice(0, 8);
      }) || [],
    [draft, suggestionPool],
  );
  const lastUsedWeightHints = useMemo(
    () =>
      draft?.exercises.map((exercise, index) => {
        const normalizedName = normalizeSuggestionValue(exercise?.name).toLowerCase();

        if (!normalizedName || !plan?.days) {
          return '';
        }

        const matchingExercises = plan.days.flatMap((day) =>
          (day.exercises || []).filter((candidate, candidateIndex) => {
            if (day.day_number === parsedDayNumber && candidateIndex === index) {
              return false;
            }

            return normalizeSuggestionValue(candidate?.name).toLowerCase() === normalizedName && Number(candidate.weight) > 0;
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
        title: normalizeWorkoutTitle(selectedDay.title, selectedDay.day_number),
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
      debugLog('image-upload', 'File selection cancelled', {
        dayNumber: parsedDayNumber,
        exerciseIndex: index,
      });
      return;
    }

    debugLog('image-upload', 'File selected', {
      dayNumber: parsedDayNumber,
      exerciseIndex: index,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    if (!isSupportedImageFile(file)) {
      const message = 'Unsupported image format. Please use JPG, PNG, or WebP.';
      setError(message);
      showToast({
        type: 'error',
        message,
      });
      return;
    }

    if (file.size > MAX_UPLOAD_FILE_BYTES) {
      const message = 'That image is too large. Please choose an image under 10 MB.';
      setError(message);
      showToast({
        type: 'error',
        message,
      });
      return;
    }

    setError('');

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
      await saveWorkoutDay(user.uid, draft.day_number, draft.exercises, draft.title);

      showToast({
        type: 'success',
        message: `${normalizeWorkoutTitle(draft.title, draft.day_number)} is saved and ready.`,
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
          <h2>{normalizeWorkoutTitle(draft.title, selectedDay.day_number)}</h2>
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

      <div className="panel stack-form">
        <label>
          <span>Workout title</span>
          <input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Push Day"
            list="workout-title-suggestions"
          />
          <datalist id="workout-title-suggestions">
            {WORKOUT_NAME_SUGGESTIONS.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
          <p className="helper-text">Give this workout a name you’ll recognize instantly.</p>
        </label>
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
