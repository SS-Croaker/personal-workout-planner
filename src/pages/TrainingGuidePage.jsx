import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkoutStore } from '../store/workoutStore';

const GUIDE_STEPS = [
  {
    eyebrow: 'Welcome',
    title: 'Build a training week you can actually follow.',
    body:
      'Training feels better when your week already has structure. This guide will help you turn your routine into something clear, repeatable, and easy to come back to.',
    accent: 'A focused home for your workouts, your progress, and your consistency.',
    highlights: [
      'See your week at a glance before you step into the gym.',
      'Keep every session organized so you always know what is next.',
      'Build momentum without turning training into admin work.',
    ],
  },
  {
    eyebrow: 'Weekly Plans',
    title: 'Create plans that match your goals, schedule, and training style.',
    body:
      'Use different plans for different seasons of training. Keep one split for strength, another for cutting, and another for busy weeks when you want something simpler.',
    accent: 'Different goals deserve different plans.',
    highlights: [
      'Build full weekly splits around the way you really train.',
      'Name your workouts your way, from Chest Day to Recovery.',
      'Switch plans anytime without losing the work you already put in.',
    ],
  },
  {
    eyebrow: 'Workouts',
    title: 'Build each workout the way you would write it in your notes, only cleaner.',
    body:
      'Add your exercises, set your weights, choose your equipment, and shape each session so it is ready when you are. Once a workout is built, it becomes much easier to stay locked in.',
    accent: 'Every workout should feel ready before the session starts.',
    highlights: [
      'Add exercises, weights, and equipment in one place.',
      'Build chest days, leg days, push days, pull days, and more.',
      'Reuse the structure you like instead of rebuilding from scratch.',
    ],
  },
  {
    eyebrow: 'Progress',
    title: 'Watch your training week come together session by session.',
    body:
      'When you complete exercises, the week starts to tell a story. You can see what is done, what is left, and where your momentum is building.',
    accent: 'Progress should feel visible, motivating, and easy to trust.',
    highlights: [
      'Mark exercises complete as you move through a workout.',
      'See each workout fill up instead of guessing how far along you are.',
      'Reset the week when you want a fresh start without losing your structure.',
    ],
  },
  {
    eyebrow: 'Consistency',
    title: 'Keep your rhythm going even when life is not perfect.',
    body:
      'Some weeks are full training weeks. Some are travel weeks, cardio weeks, or recovery weeks. The goal here is to help you keep showing up and see that consistency over time.',
    accent: 'Your calendar becomes a clear picture of your momentum.',
    highlights: [
      'Log workout days and see your month fill in over time.',
      'Keep a realistic consistency streak without guilt-driven pressure.',
      'Look back at your training rhythm and stay connected to the habit.',
    ],
  },
  {
    eyebrow: 'Ready',
    title: 'Start with one plan, then let it evolve with you.',
    body:
      'You do not need to build the perfect routine on day one. Start with the week you want to train now, duplicate what works later, and keep shaping it as your goals change.',
    accent: 'Built to help you train with clarity, consistency, and confidence.',
    highlights: [
      'Start simple and build out your first week fast.',
      'Duplicate older plans when you want a new version of a routine you already like.',
      'Step into every session knowing your plan is already waiting for you.',
    ],
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
            <div className="training-guide-step-meta">
              <span>{stepIndex + 1} / {GUIDE_STEPS.length}</span>
            </div>
            <h1>{step.title}</h1>
            <p className="muted">{step.body}</p>
            <div className="training-guide-highlights">
              {step.highlights.map((highlight) => (
                <div key={highlight} className="training-guide-highlight">
                  <span className="training-guide-highlight-dot" aria-hidden="true" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="training-guide-feature">
            <div className="training-guide-feature-orb" aria-hidden="true" />
            <strong>{step.accent}</strong>
          </div>
        </article>

        <div className="training-guide-footer">
          <span>Built by Saurabh from Celsius 233</span>
          <a
            href="https://www.linkedin.com/in/saurabh-singh3994/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        </div>

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
