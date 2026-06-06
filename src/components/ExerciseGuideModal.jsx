import { useEffect, useMemo, useState } from 'react';
import { getExerciseById, getExerciseBySlug } from '../services/exerciseLibraryService';

function GuideDetail({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <div className="exercise-guide-detail">
      <p className="eyebrow">{label}</p>
      <p>{value}</p>
    </div>
  );
}

export default function ExerciseGuideModal({ exercise, onClose }) {
  const [imageAvailable, setImageAvailable] = useState(true);
  const libraryExercise = useMemo(() => {
    if (!exercise || exercise.library_status === 'pending') {
      return null;
    }

    return getExerciseById(exercise.exercise_id) || getExerciseBySlug(exercise.exercise_slug);
  }, [exercise]);

  useEffect(() => {
    if (!exercise) {
      return undefined;
    }

    setImageAvailable(true);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [exercise, onClose]);

  if (!exercise) {
    return null;
  }

  const exerciseName = exercise.name || 'Exercise Guide';

  return (
    <div className="modal-overlay exercise-guide-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card exercise-guide-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-guide-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="exercise-guide-header">
          <div>
            <p className="eyebrow">Exercise Guide</p>
            <h3 id="exercise-guide-title">{exerciseName}</h3>
            {libraryExercise?.category ? <p className="muted">{libraryExercise.category}</p> : null}
          </div>
          <button type="button" className="icon-button exercise-guide-close" onClick={onClose} aria-label="Close exercise guide">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6 18 18M18 6 6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {libraryExercise ? (
          <div className="exercise-guide-layout">
            <div className="exercise-guide-visual">
              {libraryExercise.image_src && imageAvailable ? (
                <img
                  src={libraryExercise.image_src}
                  alt={libraryExercise.exercise_name}
                  className="exercise-guide-image"
                  loading="lazy"
                  onError={() => setImageAvailable(false)}
                />
              ) : (
                <div className="exercise-guide-image-placeholder">
                  <p className="muted">Exercise image not available yet.</p>
                </div>
              )}
            </div>

            <div className="exercise-guide-content">
              <GuideDetail label="Overview" value={libraryExercise.description} />
              <GuideDetail label="Starting Position" value={libraryExercise.starting_position} />
              <GuideDetail label="Execution" value={libraryExercise.execution} />

              <div className="exercise-guide-meta-grid">
                <GuideDetail label="Equipment Required" value={libraryExercise.equipment_required} />
                <GuideDetail label="Main Muscles" value={libraryExercise.main_muscles} />
                <GuideDetail label="Secondary Muscles" value={libraryExercise.secondary_muscles} />
              </div>
            </div>
          </div>
        ) : (
          <div className="exercise-guide-empty">
            <p className="muted">Exercise guide not available yet.</p>
            <p className="helper-text">
              You can keep training as usual. We’ll show a full guide here once this exercise is matched with confidence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
