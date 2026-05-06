import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkoutStore } from '../store/workoutStore';
import ToastStack from './ToastStack';

export default function AppShell() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const signOutUser = useAuthStore((state) => state.signOutUser);
  const profile = useWorkoutStore((state) => state.profile);
  const plan = useWorkoutStore((state) => state.plan);
  const statusText = location.pathname === '/' ? 'Ready when you are' : 'Workout in progress';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.removeProperty('overflow');
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.removeProperty('overflow');
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
        <div>
          <p className="eyebrow">Personal Workout Planner</p>
          <h1>Plan your workouts. Track your progress.</h1>
          <p className="muted">
            Everything you need is right here when you're ready to train.
          </p>
        </div>

        <nav className="nav-links">
          <NavLink to="/" onClick={closeMobileMenu}>Dashboard</NavLink>
          <NavLink to="/create-plan" onClick={closeMobileMenu}>{plan ? 'New Plan' : 'Create Plan'}</NavLink>
          <NavLink to="/profile-setup" onClick={closeMobileMenu}>{profile ? 'Profile' : 'Set Up Profile'}</NavLink>
        </nav>

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
