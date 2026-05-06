import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';
import AuthPage from './pages/AuthPage';
import CreateWorkoutPlanPage from './pages/CreateWorkoutPlanPage';
import Dashboard from './pages/Dashboard';
import DayEditor from './pages/DayEditor';
import DayView from './pages/DayView';
import ProfileSetupPage from './pages/ProfileSetupPage';
import { useAuthStore } from './store/authStore';
import { useWorkoutStore } from './store/workoutStore';

function AuthBootstrap() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe?.();
  }, [initializeAuth]);

  return null;
}

function AppRoutes() {
  const authReady = useAuthStore((state) => state.authReady);
  const user = useAuthStore((state) => state.user);
  const hydrateFromCloud = useWorkoutStore((state) => state.hydrateFromCloud);
  const sessionUid = useWorkoutStore((state) => state.sessionUid);
  const bootstrapped = useWorkoutStore((state) => state.bootstrapped);
  const loading = useWorkoutStore((state) => state.loading);
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
      hydrateFromCloud(user.uid);
    }
  }, [authReady, bootstrapped, clearWorkoutState, hydrateFromCloud, sessionUid, user]);

  if (!authReady || (user && loading && !bootstrapped)) {
    return <Loader fullScreen label="Getting your workouts ready..." />;
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
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
