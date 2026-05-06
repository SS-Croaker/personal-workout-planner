import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { useAuthStore } from '../store/authStore';
import { useFeedbackStore } from '../store/feedbackStore';
import { useWorkoutStore } from '../store/workoutStore';
import { formatExerciseWeight } from '../utils/plan';

export default function Dashboard() {
  const navigate = useNavigate();
  const [statsOpen, setStatsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const showToast = useFeedbackStore((state) => state.showToast);
  const profile = useWorkoutStore((state) => state.profile);
  const plans = useWorkoutStore((state) => state.plans);
  const activePlanId = useWorkoutStore((state) => state.activePlanId);
  const plan = useWorkoutStore((state) => state.plan);
  const loading = useWorkoutStore((state) => state.loading);
  const resetPlanProgress = useWorkoutStore((state) => state.resetPlanProgress);
  const switchActivePlan = useWorkoutStore((state) => state.switchActivePlan);

  if (loading && !profile) {
    return null;
  }

  if (!profile) {
    return <Navigate to="/profile-setup" replace />;
  }

  const handleViewDay = (dayNumber) => {
    navigate(`/day/${dayNumber}`);
  };

  const handleEditDay = (event, dayNumber) => {
    event.stopPropagation();
    navigate(`/day/${dayNumber}/edit`);
  };

  const handleResetPlan = async () => {
    try {
      await resetPlanProgress(user.uid);
      showToast({
        type: 'success',
        message: 'Progress cleared. Your workouts are ready for a fresh start.',
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: error.message || 'We couldn’t reset your progress right now.',
      });
    }
  };

  const handleSwitchPlan = async (event) => {
    const nextPlanId = event.target.value;
    if (!nextPlanId || nextPlanId === activePlanId) {
      return;
    }

    try {
      await switchActivePlan(user.uid, nextPlanId);
      showToast({
        type: 'success',
        message: 'You’re now viewing a different workout plan.',
      });
    } catch (error) {
      showToast({
        type: 'error',
        message: error.message || 'We couldn’t switch workout plans right now.',
      });
    }
  };

  return (
    <section className="page-section dashboard-page">
      <div className={`panel dashboard-summary ${statsOpen ? 'dashboard-summary-open' : ''}`}>
        <div className="dashboard-summary-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>Welcome back, {profile.name}. Let’s get to work.</h2>
          </div>
          <button
            type="button"
            className="secondary-button inline-button summary-toggle"
            onClick={() => setStatsOpen((current) => !current)}
            aria-expanded={statsOpen}
            aria-controls="dashboard-stats"
          >
            {statsOpen ? 'Hide Stats' : 'View Stats'}
          </button>
        </div>
        <p className="muted dashboard-summary-copy">
          Your weekly plan is lined up and ready when you are.
        </p>

        <div id="dashboard-stats" className={`dashboard-stats-wrap ${statsOpen ? 'open' : ''}`}>
          <div className="stats-grid">
            <StatCard label="BMI" value={profile.bmi || '--'} hint="Saved from your profile details." />
            <StatCard label="Height" value={`${profile.height_cm || '--'} cm`} />
            <StatCard label="Weight" value={`${profile.weight_kg || '--'} kg`} />
            <StatCard label="Workout Days" value={plan?.days_per_week || 0} hint="" />
          </div>
        </div>
      </div>

      {!plan ? (
        <div className="panel empty-state dashboard-plan-panel">
          <h3>Your first workout plan starts here</h3>
          <p className="muted">
            Build out your week, add your exercises, and give yourself a clear plan to follow.
          </p>
          <Link to="/create-plan" className="primary-button inline-button">
            Create Workout Plan
          </Link>
        </div>
      ) : (
        <div className="panel dashboard-plan-panel">
          <div className="panel-header-row">
            <div>
              <h3>Your Weekly Workout Plan</h3>
              <p className="helper-text">
                Current plan: {plan.name} • {plan.days.length} workouts
              </p>
            </div>
            <div className="plan-controls">
              <label className="plan-selector">
                <span className="helper-text">Choose a plan</span>
                <select value={activePlanId || ''} onChange={handleSwitchPlan}>
                  {plans.map((planOption) => (
                    <option key={planOption.id} value={planOption.id}>
                      {planOption.name}
                    </option>
                  ))}
                </select>
              </label>
              <Link to="/create-plan" className="primary-button inline-button">
                New Plan
              </Link>
              <button type="button" className="secondary-button inline-button" onClick={handleResetPlan}>
                Reset Progress
              </button>
            </div>
          </div>

          <div className="day-grid">
            {plan.days.map((day) => (
              (() => {
                const completedCount = day.exercises.filter((exercise) => exercise.completed).length;
                const totalExercises = day.exercises.length;
                const progressPercent = totalExercises === 0 ? 0 : Math.round((completedCount / totalExercises) * 100);

                return (
                  <article
                    key={day.day_number}
                    className="day-card clickable-card"
                    onClick={() => handleViewDay(day.day_number)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleViewDay(day.day_number);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="day-card-header">
                      <div>
                        <p className="eyebrow">Workout {day.day_number}</p>
                        <h3>{day.exercises.length} exercises</h3>
                        <p className="helper-text day-progress-copy">
                          {completedCount}/{totalExercises} completed
                        </p>
                      </div>
                    </div>
                    <div className="mini-progress-track" aria-hidden="true">
                      <div className="mini-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <ul className="exercise-summary-list">
                      {day.exercises.slice(0, 3).map((exercise, index) => (
                        <li
                          key={`${exercise.name}-${index}`}
                          className={`exercise-preview-row ${exercise.completed ? 'exercise-preview-row-complete' : ''}`}
                        >
                          <span className="exercise-preview-name">{exercise.name || 'Unnamed exercise'}</span>
                          <span className="exercise-preview-weight">
                            {formatExerciseWeight(exercise.weight, exercise.weight_unit)}
                          </span>
                        </li>
                      ))}
                      {day.exercises.length === 0 ? <li>Add your first exercise to get started.</li> : null}
                    </ul>
                    <div className="day-card-actions">
                      <button type="button" className="primary-button inline-button" onClick={() => handleViewDay(day.day_number)}>
                        View All
                      </button>
                      <button
                        type="button"
                        className="secondary-button inline-button"
                        onClick={(event) => handleEditDay(event, day.day_number)}
                      >
                        Edit Workout
                      </button>
                    </div>
                  </article>
                );
              })()
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
