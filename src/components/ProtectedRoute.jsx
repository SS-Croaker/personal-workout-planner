import { Navigate } from 'react-router-dom';
import Loader from './Loader';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children }) {
  const authReady = useAuthStore((state) => state.authReady);
  const user = useAuthStore((state) => state.user);

  if (!authReady) {
    return <Loader fullScreen label="Checking your session..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
