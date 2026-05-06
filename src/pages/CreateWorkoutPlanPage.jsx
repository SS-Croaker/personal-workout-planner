import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkoutStore } from '../store/workoutStore';
import { createEmptyPlanDays } from '../utils/plan';

export default function CreateWorkoutPlanPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const createPlan = useWorkoutStore((state) => state.createPlan);
  const plan = useWorkoutStore((state) => state.plan);
  const plans = useWorkoutStore((state) => state.plans);
  const [planName, setPlanName] = useState(`Plan ${Math.max(plans.length + 1, 1)}`);
  const [daysPerWeek, setDaysPerWeek] = useState(plan?.days_per_week || 4);
  const [previewDays, setPreviewDays] = useState(() => createEmptyPlanDays(plan?.days_per_week || 4));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleDaysPerWeekChange = (value) => {
    const nextCount = Number(value) || 1;
    setDaysPerWeek(nextCount);
    setPreviewDays((current) => createEmptyPlanDays(nextCount, current));
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
          <h2>{plans.length > 0 ? 'Create a new workout plan' : 'Build your first workout plan'}</h2>
        </div>
        <p className="muted">
          Give your plan a name, choose your training days, and start building with confidence.
        </p>
      </div>

      <form className="panel stack-form" onSubmit={handleSubmit}>
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

        <div className="preview-grid">
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
              <p className="helper-text">You can add exercises to this workout whenever you’re ready.</p>
            </div>
          ))}
        </div>

        {error ? <p className="feedback-inline feedback-error">{error}</p> : null}

        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Saving your plan...' : plans.length > 0 ? 'Create New Plan' : 'Create Plan'}
        </button>
      </form>
    </section>
  );
}
