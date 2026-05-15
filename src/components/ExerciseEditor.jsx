import {
  EXERCISE_EQUIPMENT,
  EXERCISE_TYPES,
  WEIGHT_UNITS,
  formatExerciseWeight,
  getExerciseEquipmentLabel,
  getExerciseTypeLabel,
  normalizeExerciseEquipment,
  normalizeExerciseType,
  normalizeWeightUnit,
} from '../utils/plan';

export default function ExerciseEditor({
  exercise,
  index,
  suggestions = [],
  lastUsedWeightHint = '',
  onChange,
  onImageChange,
  onRemove,
}) {
  const datalistId = `exercise-suggestions-${index}`;
  const safeSuggestions = Array.isArray(suggestions) ? suggestions.filter((suggestion) => typeof suggestion === 'string' && suggestion.trim()) : [];

  return (
    <div className="exercise-card">
      <div className="exercise-card-header">
        <div className="exercise-card-title">
          <p className="eyebrow">Exercise {index + 1}</p>
        </div>
        <button
          type="button"
          className="icon-button exercise-remove-button"
          onClick={() => onRemove(index)}
          aria-label={`Remove exercise ${index + 1}`}
          title="Remove exercise"
        >
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

      <div className="exercise-editor-grid">
        <label className="exercise-field exercise-field-name">
          <span>Name</span>
          <input
            value={exercise.name}
            onChange={(event) => onChange(index, 'name', event.target.value)}
            placeholder="Bench Press"
            list={datalistId}
            autoComplete="off"
          />
          <datalist id={datalistId}>
            {safeSuggestions.map((suggestion, suggestionIndex) => (
              <option key={`${datalistId}-${suggestionIndex}-${suggestion}`} value={suggestion} />
            ))}
          </datalist>
          {lastUsedWeightHint ? <p className="helper-text compact-helper-text">Last used: {lastUsedWeightHint}</p> : null}
        </label>

        <label className="exercise-field">
          <span>Type</span>
          <select
            value={normalizeExerciseType(exercise.type)}
            onChange={(event) => onChange(index, 'type', event.target.value)}
          >
            {EXERCISE_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="exercise-field">
          <span>Equipment</span>
          <select
            value={normalizeExerciseEquipment(exercise.equipment)}
            onChange={(event) => onChange(index, 'equipment', event.target.value)}
          >
            <option value="">Select equipment</option>
            {EXERCISE_EQUIPMENT.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="exercise-field">
          <span>Weight</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={exercise.weight}
            onChange={(event) => onChange(index, 'weight', event.target.value)}
            placeholder="40"
          />
        </label>

        <label className="exercise-field">
          <span>Unit</span>
          <select
            value={normalizeWeightUnit(exercise.weight_unit)}
            onChange={(event) => onChange(index, 'weight_unit', event.target.value)}
          >
            {WEIGHT_UNITS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="exercise-field exercise-field-image">
          <span>Exercise image</span>
          <input type="file" accept="image/*" onChange={(event) => onImageChange(index, event.target.files?.[0])} />
        </label>
      </div>

      <div className="exercise-card-meta">
        <span>{getExerciseTypeLabel(exercise.type)}</span>
        <span>{getExerciseEquipmentLabel(exercise.equipment)}</span>
        <span>{formatExerciseWeight(exercise.weight, exercise.weight_unit)}</span>
      </div>

      {exercise.image_url ? (
        <div className="image-preview-row">
          <img src={exercise.image_url} alt={exercise.name || `Exercise ${index + 1}`} className="image-preview" />
          <p className="helper-text compact-helper-text">Image ready</p>
        </div>
      ) : null}

      {exercise.pendingImageName ? (
        <p className="helper-text compact-helper-text">Uploading next: {exercise.pendingImageName}</p>
      ) : null}
    </div>
  );
}
