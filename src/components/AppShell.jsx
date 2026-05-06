import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useFeedbackStore } from '../store/feedbackStore';
import { useWorkoutStore } from '../store/workoutStore';
import ToastStack from './ToastStack';

export default function AppShell() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const signOutUser = useAuthStore((state) => state.signOutUser);
  const user = useAuthStore((state) => state.user);
  const showToast = useFeedbackStore((state) => state.showToast);
  const profile = useWorkoutStore((state) => state.profile);
  const plans = useWorkoutStore((state) => state.plans);
  const activePlanId = useWorkoutStore((state) => state.activePlanId);
  const plan = useWorkoutStore((state) => state.plan);
  const switchActivePlan = useWorkoutStore((state) => state.switchActivePlan);
  const statusText = location.pathname === '/' ? 'Ready when you are' : 'Workout in progress';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
      return undefined;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
      window.removeEventListener('keydown', handleEscape);
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    closeMobileMenu();
    signOutUser();
  };

  const handleSwitchPlan = async (event) => {
    const nextPlanId = event.target.value;
    if (!user?.uid || !nextPlanId || nextPlanId === activePlanId) {
      return;
    }

    try {
      await switchActivePlan(user.uid, nextPlanId);
      showToast({
        type: 'success',
        message: 'You’re now viewing a different workout plan.',
      });
      closeMobileMenu();
    } catch (error) {
      showToast({
        type: 'error',
        message: error.message || 'We couldn’t switch workout plans right now.',
      });
    }
  };

  return (
    <div className="app-shell">
      <header className="mobile-topbar">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-sidebar"
        >
          <span />
          <span />
          <span />
        </button>
        <div className="mobile-topbar-copy">
          <p className="eyebrow">Personal Workout Planner</p>
          <strong>{profile?.name ? `${profile.name}'s plan` : 'Your workout plan'}</strong>
        </div>
      </header>

      <button
        type="button"
        className={`mobile-sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={closeMobileMenu}
        aria-label="Close navigation menu"
      />

      <aside id="mobile-sidebar" className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-main">
          <p className="eyebrow">Personal Workout Planner</p>
          <h1>Plan your workouts. Track your progress.</h1>
          <p className="muted">
            Everything you need is right here when you're ready to train.
          </p>

          <nav className="nav-links">
            <NavLink to="/" onClick={closeMobileMenu}>Dashboard</NavLink>
            <NavLink to="/create-plan" onClick={closeMobileMenu}>Plans</NavLink>
            <NavLink to="/profile-setup" onClick={closeMobileMenu}>{profile ? 'Profile' : 'Set Up Profile'}</NavLink>
            <NavLink to="/training-guide" onClick={closeMobileMenu}>Training Guide</NavLink>
          </nav>

          {plans.length > 0 ? (
            <section className="sidebar-plan-switcher">
              <div className="sidebar-plan-header">
                <p className="eyebrow">Active Plan</p>
                <strong>{plan?.name || 'Workout Plan'}</strong>
              </div>
              <label className="plan-selector">
                <span className="helper-text">Switch plan</span>
                <select value={activePlanId || ''} onChange={handleSwitchPlan}>
                  {plans.map((planOption) => (
                    <option key={planOption.id} value={planOption.id}>
                      {planOption.name}
                    </option>
                  ))}
                </select>
              </label>
              <NavLink to="/create-plan" className="sidebar-link-button" onClick={closeMobileMenu}>
                Create another plan
              </NavLink>
            </section>
          ) : null}
        </div>

        <div className="sidebar-footer">
          <div className="status-chip">
            <span className="status-dot" />
            <span>{statusText}</span>
          </div>
          <button type="button" className="secondary-button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="page-content">
        <Outlet />
      </main>
      <ToastStack />
    </div>
  );
}
