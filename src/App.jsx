import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';
import AuthPage from './pages/AuthPage';
import CreateWorkoutPlanPage from './pages/CreateWorkoutPlanPage';
import Dashboard from './pages/Dashboard';
import DayEditor from './pages/DayEditor';
import DayView from './pages/DayView';
import ProfileSetupPage from './pages/ProfileSetupPage';
import TrainingGuidePage from './pages/TrainingGuidePage';
import { useAuthStore } from './store/authStore';
import { useWorkoutStore } from './store/workoutStore';

function BootstrapRecoveryScreen() {
  const user = useAuthStore((state) => state.user);
  const hydrateFromCloud = useWorkoutStore((state) => state.hydrateFromCloud);
  const clearBootstrapError = useWorkoutStore((state) => state.clearBootstrapError);
  const bootstrapError = useWorkoutStore((state) => state.bootstrapError);
  const loading = useWorkoutStore((state) => state.loading);

  const handleRetry = async () => {
    if (!user?.uid || loading) {
      return;
    }

    clearBootstrapError();

    try {
      await hydrateFromCloud(user.uid, true);
    } catch {
      // The store keeps the latest startup error for recovery rendering.
    }
  };

  return (
    <div className="centered-page">
      <div className="auth-card">
        <p className="eyebrow">Startup Recovery</p>
        <h1>We could not load your workout data.</h1>
        <p className="muted">
          {bootstrapError || 'Please check your connection and try again.'}
        </p>
        <div className="stack-form">
          <button type="button" className="primary-button" onClick={handleRetry} disabled={loading}>
            {loading ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthBootstrap() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe?.();
  }, [initializeAuth]);

  return null;
}

function AppRoutes() {
  const location = useLocation();
  const authReady = useAuthStore((state) => state.authReady);
  const user = useAuthStore((state) => state.user);
  const hydrateFromCloud = useWorkoutStore((state) => state.hydrateFromCloud);
  const onboardingCompleted = useWorkoutStore((state) => state.onboardingCompleted);
  const sessionUid = useWorkoutStore((state) => state.sessionUid);
  const bootstrapped = useWorkoutStore((state) => state.bootstrapped);
  const loading = useWorkoutStore((state) => state.loading);
  const bootstrapError = useWorkoutStore((state) => state.bootstrapError);
  const clearWorkoutState = useWorkoutStore((state) => state.clearWorkoutState);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!user) {
      clearWorkoutState();
      return;
    }

    if (sessionUid !== user.uid || !bootstrapped) {
      hydrateFromCloud(user.uid).catch(() => {
        // Recovery UI is driven by store state.
      });
    }
  }, [authReady, bootstrapped, clearWorkoutState, hydrateFromCloud, sessionUid, user]);

  if (!authReady || (user && loading && !bootstrapped)) {
    return <Loader fullScreen label="Getting your workouts ready..." />;
  }

  if (user && bootstrapError) {
    return <BootstrapRecoveryScreen />;
  }

  if (user && bootstrapped && !loading && !onboardingCompleted && location.pathname !== '/training-guide') {
    return <Navigate to="/training-guide" replace />;
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to={onboardingCompleted ? '/' : '/training-guide'} replace /> : <AuthPage />} />
      <Route
        path="/training-guide"
        element={
          <ProtectedRoute>
            <TrainingGuidePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile-setup" element={<ProfileSetupPage />} />
        <Route path="create-plan" element={<CreateWorkoutPlanPage />} />
        <Route path="day/:dayNumber" element={<DayView />} />
        <Route path="day/:dayNumber/edit" element={<DayEditor />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/auth'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <>
      <AuthBootstrap />
      <AppRoutes />
    </>
  );
}
