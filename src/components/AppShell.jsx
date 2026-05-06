import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkoutStore } from '../store/workoutStore';
import ToastStack from './ToastStack';

export default function AppShell() {
  const location = useLocation();
  const signOutUser = useAuthStore((state) => state.signOutUser);
  const profile = useWorkoutStore((state) => state.profile);
  const plan = useWorkoutStore((state) => state.plan);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Personal Workout Planner</p>
          <h1>Plan your workouts. Track your progress.</h1>
          <p className="muted">
            Everything you need is right here when you're ready to train.
          </p>
        </div>

        <nav className="nav-links">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/profile-setup">{profile ? 'Your Profile' : 'Set Up Profile'}</NavLink>
          <NavLink to="/create-plan">{plan ? 'New Plan' : 'Create Plan'}</NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="status-chip">
            <span className="status-dot" />
            <span>{location.pathname === '/' ? 'Ready when you are' : 'Workout in progress'}</span>
          </div>
          <button type="button" className="secondary-button" onClick={signOutUser}>
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
