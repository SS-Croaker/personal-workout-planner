import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkoutStore } from '../store/workoutStore';

const GUIDE_STEPS = [
  {
    eyebrow: 'Welcome',
    title: 'Your training week starts with a clear plan.',
    body:
      'Build workouts, track every session, and keep your routine moving with a planner that stays focused on consistency.',
    accent: 'Plan workouts. Track progress. Stay consistent.',
  },
  {
    eyebrow: 'Weekly Plans',
    title: 'Shape each week around the way you actually train.',
    body:
      'Create multiple plans, name each workout your way, and organize your week so every session has a clear role.',
    accent: 'Multiple plans. Custom workout names. Structured training days.',
  },
  {
    eyebrow: 'Progress',
    title: 'Turn every workout into visible momentum.',
    body:
      'Mark exercises complete, watch progress fill in, and reset the week whenever you need a fresh run without losing your plan.',
    accent: 'Complete exercises. Monitor progress. Reset without losing structure.',
  },
  {
    eyebrow: 'Exercise Setup',
    title: 'Keep every exercise organized and easy to track.',
    body:
      'Add movements, choose equipment, save weights in kg or lbs, and build sessions that are clean, practical, and ready to follow.',
    accent: 'Exercise library. Equipment. Weight units. Organized sessions.',
  },
  {
    eyebrow: 'Ready',
    title: 'Everything is set up for your next session.',
    body:
      'When you are ready, head into your weekly plan, build your workouts, and start stacking completed sessions.',
    accent: 'Train with clarity. Track with confidence.',
  },
];

export default function TrainingGuidePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const profile = useWorkoutStore((state) => state.profile);
  const plan = useWorkoutStore((state) => state.plan);
  const onboardingCompleted = useWorkoutStore((state) => state.onboardingCompleted);
  const completeOnboarding = useWorkoutStore((state) => state.completeOnboarding);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const isFirstRun = !onboardingCompleted;
  const step = GUIDE_STEPS[stepIndex];
  const isLastStep = stepIndex === GUIDE_STEPS.length - 1;
  const nextDestination = useMemo(() => {
    if (!profile) {
      return '/profile-setup';
    }

    if (!plan) {
      return '/create-plan';
    }

    return '/';
  }, [plan, profile]);

  const finishGuide = async () => {
    if (!user) {
      return;
    }

    setSubmitting(true);

    try {
      if (isFirstRun) {
        await completeOnboarding(user.uid);
        navigate(nextDestination, { replace: true });
        return;
      }

      navigate(-1);
    } finally {
      setSubmitting(false);
    }
  };

  const skipGuide = async () => {
    if (submitting) {
      return;
    }

    await finishGuide();
  };

  return (
    <section className="training-guide-screen">
      <div className="training-guide-backdrop" />
      <div className="training-guide-shell">
        <div className="training-guide-topbar">
          <p className="eyebrow">Training Guide</p>
          <button type="button" className="text-button subtle-action-link" onClick={skipGuide} disabled={submitting}>
            {isFirstRun ? 'Skip' : 'Done'}
          </button>
        </div>

        <div className="training-guide-progress" aria-label={`Step ${stepIndex + 1} of ${GUIDE_STEPS.length}`}>
          {GUIDE_STEPS.map((guideStep, index) => (
            <span
              key={guideStep.title}
              className={`training-guide-dot ${index === stepIndex ? 'training-guide-dot-active' : ''}`}
            />
          ))}
        </div>

        <article className="training-guide-card">
          <div className="training-guide-copy">
            <p className="eyebrow">{step.eyebrow}</p>
            <h1>{step.title}</h1>
            <p className="muted">{step.body}</p>
          </div>

          <div className="training-guide-feature">
            <div className="training-guide-feature-orb" aria-hidden="true" />
            <strong>{step.accent}</strong>
          </div>
        </article>

        <div className="training-guide-actions">
          <button
            type="button"
            className="secondary-button inline-button"
            onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
            disabled={stepIndex === 0 || submitting}
          >
            Previous
          </button>

          {isLastStep ? (
            <button type="button" className="primary-button inline-button" onClick={finishGuide} disabled={submitting}>
              {submitting ? 'Opening your training...' : 'Start Training'}
            </button>
          ) : (
            <button
              type="button"
              className="primary-button inline-button"
              onClick={() => setStepIndex((current) => Math.min(current + 1, GUIDE_STEPS.length - 1))}
              disabled={submitting}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
