import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useFeedbackStore } from '../store/feedbackStore';
import { useWorkoutStore } from '../store/workoutStore';
import {
  formatExerciseWeight,
  getExerciseEquipmentLabel,
} from '../utils/plan';

export default function DayView() {
  const { dayNumber } = useParams();
  const user = useAuthStore((state) => state.user);
  const plan = useWorkoutStore((state) => state.plan);
  const toggleExerciseCompletion = useWorkoutStore((state) => state.toggleExerciseCompletion);
  const showToast = useFeedbackStore((state) => state.showToast);
  const [error, setError] = useState('');
  const [completionNotice, setCompletionNotice] = useState('');
  const parsedDayNumber = Number(dayNumber);
  const selectedDay = plan?.days.find((day) => day.day_number === parsedDayNumber);

  if (!plan) {
    return <Navigate to="/create-plan" replace />;
  }

  if (!Number.isFinite(parsedDayNumber) || !selectedDay) {
    return <Navigate to="/" replace />;
  }

  const completedCount = selectedDay.exercises.filter((exercise) => exercise.completed).length;
  const totalExercises = selectedDay.exercises.length;
  const progressPercent = totalExercises === 0 ? 0 : Math.round((completedCount / totalExercises) * 100);

  useEffect(() => {
    if (!completionNotice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCompletionNotice('');
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [completionNotice]);

  const handleToggleCompletion = async (exerciseIndex, completed) => {
    setError('');

    try {
      await toggleExerciseCompletion(user.uid, selectedDay.day_number, exerciseIndex, completed);
      setCompletionNotice(completed ? 'Exercise marked complete.' : 'Exercise marked incomplete.');
    } catch (toggleError) {
      const message = toggleError.message || 'Unable to update exercise status.';
      setError(message);
      showToast({
        type: 'error',
        message,
      });
    }
  };

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Workout View</p>
          <h2>Workout {selectedDay.day_number}</h2>
        </div>
        <p className="muted">
          {completedCount}/{totalExercises} exercises completed. Updates are saved from cached state without reloading the page.
        </p>
      </div>

      <div className="panel progress-panel">
        <div className="progress-row">
          <strong>
            Progress: {completedCount}/{totalExercises}
          </strong>
          <span className="helper-text">{progressPercent}% complete</span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        {completionNotice ? <p className="feedback-inline feedback-success subtle-feedback">{completionNotice}</p> : null}
      </div>

      <div className="editor-toolbar">
        <Link to="/" className="secondary-button inline-button">
          Back to Dashboard
        </Link>
        <Link to={`/day/${selectedDay.day_number}/edit`} className="primary-button inline-button">
          Edit Workout
        </Link>
      </div>

      <div className="panel">
        {selectedDay.exercises.length === 0 ? (
          <div className="empty-state">
            <h3>No exercises added yet</h3>
            <p className="muted">Open the editor to add exercises for this workout.</p>
          </div>
        ) : (
          <div className="day-view-list">
            {selectedDay.exercises.map((exercise, index) => (
              <label
                key={`${exercise.name || 'exercise'}-${index}`}
                className={`day-view-row ${exercise.completed ? 'day-view-row-complete' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(exercise.completed)}
                  onChange={(event) => handleToggleCompletion(index, event.target.checked)}
                />
                <div className="day-view-main">
                  <strong className="day-view-name">{exercise.name || `Exercise ${index + 1}`}</strong>
                  <span className="helper-text day-view-mobile-meta">
                    {formatExerciseWeight(exercise.weight, exercise.weight_unit)} • {getExerciseEquipmentLabel(exercise.equipment)}
                  </span>
                </div>
                <div className="day-view-weight">{formatExerciseWeight(exercise.weight, exercise.weight_unit)}</div>
                <div className="day-view-meta">
                  <span>{getExerciseEquipmentLabel(exercise.equipment)}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {error ? <p className="feedback-inline feedback-error">{error}</p> : null}
    </section>
  );
}
