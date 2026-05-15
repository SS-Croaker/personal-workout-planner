import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkoutStore } from '../store/workoutStore';
import { createEmptyPlanDays } from '../utils/plan';

function clonePlanDays(days = []) {
  return days.map((day, index) => ({
    day_number: index + 1,
    title: day?.title || `Workout ${index + 1}`,
    exercises: Array.isArray(day?.exercises)
      ? day.exercises.map((exercise) => ({
          ...exercise,
        }))
      : [],
  }));
}

function resizeDraftDays(nextCount, currentDays = []) {
  return Array.from({ length: nextCount }, (_, index) => ({
    day_number: index + 1,
    title: currentDays[index]?.title || createEmptyPlanDays(nextCount)[index]?.title || `Workout ${index + 1}`,
    exercises: Array.isArray(currentDays[index]?.exercises)
      ? currentDays[index].exercises.map((exercise) => ({
          ...exercise,
        }))
      : [],
  }));
}

export default function CreateWorkoutPlanPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const createPlan = useWorkoutStore((state) => state.createPlan);
  const plans = useWorkoutStore((state) => state.plans);
  const activePlan = useWorkoutStore((state) => state.plan);
  const sourcePlans = useMemo(() => plans, [plans]);
  const defaultSourcePlan = activePlan || sourcePlans[0] || null;
  const [creationMode, setCreationMode] = useState(sourcePlans.length > 0 ? 'scratch' : 'scratch');
  const [duplicateSourceId, setDuplicateSourceId] = useState(defaultSourcePlan?.id || '');
  const [planName, setPlanName] = useState(`Plan ${Math.max(sourcePlans.length + 1, 1)}`);
  const [daysPerWeek, setDaysPerWeek] = useState(defaultSourcePlan?.days_per_week || 4);
  const [previewDays, setPreviewDays] = useState(() => createEmptyPlanDays(defaultSourcePlan?.days_per_week || 4));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedSourcePlan = sourcePlans.find((plan) => plan.id === duplicateSourceId) || defaultSourcePlan;

  const switchToScratch = () => {
    setCreationMode('scratch');
    setPlanName(`Plan ${Math.max(sourcePlans.length + 1, 1)}`);
    setDaysPerWeek(activePlan?.days_per_week || 4);
    setPreviewDays(createEmptyPlanDays(activePlan?.days_per_week || 4));
  };

  const switchToDuplicate = () => {
    if (!selectedSourcePlan) {
      return;
    }

    const clonedDays = clonePlanDays(selectedSourcePlan.days);
    setCreationMode('duplicate');
    setPlanName(`${selectedSourcePlan.name} Copy`);
    setDaysPerWeek(selectedSourcePlan.days_per_week || selectedSourcePlan.days?.length || 4);
    setPreviewDays(clonedDays);
  };

  const handleDaysPerWeekChange = (value) => {
    const nextCount = Number(value) || 1;
    setDaysPerWeek(nextCount);
    setPreviewDays((current) => resizeDraftDays(nextCount, current));
  };

  const handleWorkoutTitleChange = (index, value) => {
    setPreviewDays((current) =>
      current.map((day, dayIndex) =>
        dayIndex === index
          ? {
              ...day,
              title: value,
            }
          : day,
      ),
    );
  };

  const handleDuplicateSourceChange = (value) => {
    setDuplicateSourceId(value);
    const sourcePlan = sourcePlans.find((plan) => plan.id === value);
    if (!sourcePlan) {
      return;
    }

    const clonedDays = clonePlanDays(sourcePlan.days);
    setPlanName(`${sourcePlan.name} Copy`);
    setDaysPerWeek(sourcePlan.days_per_week || sourcePlan.days?.length || 4);
    setPreviewDays(clonedDays);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!planName.trim()) {
      setError('Please give your workout plan a name.');
      return;
    }

    setSaving(true);

    try {
      await createPlan(user.uid, planName, Number(daysPerWeek), previewDays);
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'We couldn’t save your workout plan right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Workout Plans</p>
          <h2>{sourcePlans.length > 0 ? 'Create a new workout plan' : 'Build your first workout plan'}</h2>
        </div>
        <p className="muted">
          Start fresh or build from an existing plan so you can move faster and fine-tune as you go.
        </p>
      </div>

      <form className="panel stack-form" onSubmit={handleSubmit}>
        {sourcePlans.length > 0 ? (
          <div className="plan-mode-section">
            <div className="segmented-control plan-mode-toggle" role="tablist" aria-label="Choose how to create your plan">
              <button
                type="button"
                className={creationMode === 'scratch' ? 'active' : ''}
                onClick={switchToScratch}
                aria-pressed={creationMode === 'scratch'}
              >
                Create From Scratch
              </button>
              <button
                type="button"
                className={creationMode === 'duplicate' ? 'active' : ''}
                onClick={switchToDuplicate}
                aria-pressed={creationMode === 'duplicate'}
              >
                Duplicate Existing Plan
              </button>
            </div>

            {creationMode === 'duplicate' ? (
              <div className="plan-duplicate-panel">
                <label>
                  <span>Duplicate from</span>
                  <select value={duplicateSourceId} onChange={(event) => handleDuplicateSourceChange(event.target.value)}>
                    {sourcePlans.map((planOption) => (
                      <option key={planOption.id} value={planOption.id}>
                        {planOption.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="helper-text">
                  This copies your workout names, exercises, and weekly structure into a brand-new editable plan.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <label>
          <span>Plan name</span>
          <input value={planName} onChange={(event) => setPlanName(event.target.value)} placeholder="Push Pull Legs" />
        </label>

        <label>
          <span>Days per week</span>
          <select value={daysPerWeek} onChange={(event) => handleDaysPerWeekChange(event.target.value)}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>

        <div className="preview-grid plan-preview-grid">
          {previewDays.map((day, index) => (
            <div key={day.day_number} className="mini-day-card">
              <label className="preview-day-label">
                <span>Workout {day.day_number}</span>
                <input
                  value={day.title}
                  onChange={(event) => handleWorkoutTitleChange(index, event.target.value)}
                  placeholder={`Workout ${day.day_number}`}
                />
              </label>
              <p className="helper-text">
                {day.exercises.length > 0
                  ? `${day.exercises.length} saved exercise${day.exercises.length === 1 ? '' : 's'} ready to go.`
                  : 'You can add exercises to this workout whenever you’re ready.'}
              </p>
            </div>
          ))}
        </div>

        {error ? <p className="feedback-inline feedback-error">{error}</p> : null}

        <button type="submit" className="primary-button" disabled={saving}>
          {saving
            ? 'Saving your plan...'
            : creationMode === 'duplicate'
              ? 'Create Duplicated Plan'
              : sourcePlans.length > 0
                ? 'Create New Plan'
                : 'Create Plan'}
        </button>
      </form>
    </section>
  );
}
