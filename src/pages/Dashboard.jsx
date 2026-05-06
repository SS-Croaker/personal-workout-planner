import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { useAuthStore } from '../store/authStore';
import { useFeedbackStore } from '../store/feedbackStore';
import { useWorkoutStore } from '../store/workoutStore';
import { formatExerciseWeight } from '../utils/plan';

export default function Dashboard() {
  const navigate = useNavigate();
  const [statsOpen, setStatsOpen] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [planPendingDelete, setPlanPendingDelete] = useState(null);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const user = useAuthStore((state) => state.user);
  const showToast = useFeedbackStore((state) => state.showToast);
  const profile = useWorkoutStore((state) => state.profile);
  const plans = useWorkoutStore((state) => state.plans);
  const plan = useWorkoutStore((state) => state.plan);
  const loading = useWorkoutStore((state) => state.loading);
  const resetPlanProgress = useWorkoutStore((state) => state.resetPlanProgress);
  const deletePlan = useWorkoutStore((state) => state.deletePlan);

  useEffect(() => {
    if (!planPendingDelete) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !deletingPlan) {
        setPlanPendingDelete(null);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [deletingPlan, planPendingDelete]);

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

  const toggleWorkoutCard = (dayNumber) => {
    setExpandedWorkout((current) => (current === dayNumber ? null : dayNumber));
  };

  const openDeletePlanModal = () => {
    if (!plan) {
      return;
    }

    setPlanPendingDelete(plan);
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

  const totalExercisesInPlan = plan?.days.reduce((sum, day) => sum + day.exercises.length, 0) || 0;
  const completedExercisesInPlan =
    plan?.days.reduce(
      (sum, day) => sum + day.exercises.filter((exercise) => exercise.completed).length,
      0,
    ) || 0;
  const overallProgressPercent =
    totalExercisesInPlan === 0 ? 0 : Math.round((completedExercisesInPlan / totalExercisesInPlan) * 100);

  const handleDeletePlan = async () => {
    if (!planPendingDelete) {
      return;
    }

    setDeletingPlan(true);

    try {
      const remainingPlanCount = plans.length - 1;
      await deletePlan(user.uid, planPendingDelete.id);
      showToast({
        type: 'success',
        message:
          remainingPlanCount > 0
            ? 'Workout plan deleted. Your next plan is ready.'
            : 'Workout plan deleted. You can build a new one whenever you’re ready.',
      });
      setPlanPendingDelete(null);
    } catch (error) {
      showToast({
        type: 'error',
        message: error.message || 'We couldn’t delete this workout plan right now.',
      });
    } finally {
      setDeletingPlan(false);
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
            <StatCard
              label="Workout Days"
              value={plan?.days_per_week || 0}
              hint={plan ? `${completedExercisesInPlan}/${totalExercisesInPlan} complete` : ''}
            />
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
            <div className="dashboard-plan-overview">
              <h3>Your Weekly Workout Plan</h3>
              <p className="helper-text">
                Active plan: {plan.name} • {plan.days.length} workouts this week
              </p>
              <div className="dashboard-plan-meta">
                <span className="plan-badge">Current Plan</span>
                <strong className="dashboard-progress-count">
                  {completedExercisesInPlan}/{totalExercisesInPlan} exercises completed
                </strong>
              </div>
              <div className="progress-track dashboard-progress-track" aria-hidden="true">
                <div className="progress-fill" style={{ width: `${overallProgressPercent}%` }} />
              </div>
            </div>
            <div className="plan-controls">
              <button type="button" className="secondary-button inline-button" onClick={handleResetPlan}>
                Reset Progress
              </button>
              <div className="management-actions">
                <Link to="/create-plan" className="subtle-action-link">
                  New Plan
                </Link>
                <button type="button" className="text-button subtle-action-link danger-text" onClick={openDeletePlanModal}>
                  Delete Plan
                </button>
              </div>
            </div>
          </div>

          <div className="day-grid">
            {plan.days.map((day) => (
              (() => {
                const isExpanded = expandedWorkout === day.day_number;
                const completedCount = day.exercises.filter((exercise) => exercise.completed).length;
                const totalExercises = day.exercises.length;
                const progressPercent = totalExercises === 0 ? 0 : Math.round((completedCount / totalExercises) * 100);

                return (
                  <article
                    key={day.day_number}
                    className={`day-card workout-accordion-card ${isExpanded ? 'workout-accordion-card-open' : ''}`}
                  >
                    <div className="day-card-topbar">
                      <button
                        type="button"
                        className="workout-accordion-toggle"
                        onClick={() => toggleWorkoutCard(day.day_number)}
                        aria-expanded={isExpanded}
                        aria-controls={`workout-card-panel-${day.day_number}`}
                      >
                        <div className="workout-accordion-header">
                          <div className="workout-accordion-heading">
                            <p className="eyebrow">Workout {day.day_number}</p>
                            <h3>{totalExercises} exercises</h3>
                          </div>
                          <div className="workout-accordion-summary">
                            <strong>{completedCount}/{totalExercises} completed</strong>
                            <span className="helper-text">
                              {progressPercent}% done
                            </span>
                          </div>
                        </div>
                        <div className="mini-progress-track workout-accordion-progress" aria-hidden="true">
                          <div className="mini-progress-fill" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <div className="workout-accordion-meta">
                          <span className="helper-text">{totalExercises} total exercises</span>
                          <span className={`accordion-chevron ${isExpanded ? 'accordion-chevron-open' : ''}`} aria-hidden="true">
                            <svg viewBox="0 0 24 24">
                              <path
                                d="m6 9 6 6 6-6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="icon-button workout-card-edit-button"
                        onClick={(event) => handleEditDay(event, day.day_number)}
                        aria-label={`Edit Workout ${day.day_number}`}
                        title="Edit Workout"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M4 20h4l10.5-10.5a1.4 1.4 0 0 0 0-2L16.5 5.5a1.4 1.4 0 0 0-2 0L4 16v4Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="m13.5 6.5 4 4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <div
                      id={`workout-card-panel-${day.day_number}`}
                      className={`workout-accordion-panel ${isExpanded ? 'workout-accordion-panel-open' : ''}`}
                    >
                      <div className="workout-accordion-panel-inner">
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
                        {day.exercises.length > 3 ? (
                          <p className="helper-text workout-accordion-detail">
                            +{day.exercises.length - 3} more exercises inside this workout
                          </p>
                        ) : null}
                        <div className="day-card-actions">
                          <button type="button" className="primary-button inline-button" onClick={() => handleViewDay(day.day_number)}>
                            View Workout
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })()
            ))}
          </div>
        </div>
      )}

      {planPendingDelete ? (
        <div className="modal-overlay" role="presentation" onClick={() => (deletingPlan ? null : setPlanPendingDelete(null))}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-plan-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="eyebrow">Delete Plan</p>
            <h3 id="delete-plan-title">Delete “{planPendingDelete.name}”?</h3>
            <p className="muted">
              This will permanently remove the plan, its workouts, and its progress. This action can’t be undone.
            </p>
            <p className="helper-text">
              {plans.length > 1
                ? 'If this is your current plan, we’ll switch you to another one automatically.'
                : 'You’ll return to an empty planner and can create a new plan anytime.'}
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button inline-button"
                onClick={() => setPlanPendingDelete(null)}
                disabled={deletingPlan}
              >
                Keep Plan
              </button>
              <button
                type="button"
                className="primary-button inline-button danger-solid-button"
                onClick={handleDeletePlan}
                disabled={deletingPlan}
              >
                {deletingPlan ? 'Deleting plan...' : 'Delete Plan'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
