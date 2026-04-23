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

  return (
    <div className="exercise-card">
      <div className="exercise-card-header">
        <h3>Exercise {index + 1}</h3>
        <button type="button" className="text-button danger-text" onClick={() => onRemove(index)}>
          Remove
        </button>
      </div>

      <div className="grid-form">
        <label>
          <span>Name</span>
          <input
            value={exercise.name}
            onChange={(event) => onChange(index, 'name', event.target.value)}
            placeholder="Bench Press"
            list={datalistId}
            autoComplete="off"
          />
          <datalist id={datalistId}>
            {suggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
          <p className="helper-text">Type freely or pick a suggested exercise.</p>
        </label>

        <label>
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
          <p className="helper-text">Current type: {getExerciseTypeLabel(exercise.type)}</p>
        </label>

        <label>
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
          <p className="helper-text">Current equipment: {getExerciseEquipmentLabel(exercise.equipment)}</p>
        </label>

        <label>
          <span>Weight</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={exercise.weight}
            onChange={(event) => onChange(index, 'weight', event.target.value)}
            placeholder="40"
          />
          <p className="helper-text">Current weight: {formatExerciseWeight(exercise.weight, exercise.weight_unit)}</p>
          {lastUsedWeightHint ? <p className="helper-text">Last used: {lastUsedWeightHint}</p> : null}
        </label>

        <label>
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

        <label>
          <span>Exercise image</span>
          <input type="file" accept="image/*" onChange={(event) => onImageChange(index, event.target.files?.[0])} />
        </label>
      </div>

      {exercise.image_url ? (
        <div className="image-preview-row">
          <img src={exercise.image_url} alt={exercise.name || `Exercise ${index + 1}`} className="image-preview" />
          <p className="helper-text">Stored image is already compressed before upload.</p>
        </div>
      ) : null}

      {exercise.pendingImageName ? (
        <p className="helper-text">Queued for compression and upload: {exercise.pendingImageName}</p>
      ) : null}
    </div>
  );
}
