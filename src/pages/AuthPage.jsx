import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const initialForm = {
  name: '',
  email: '',
  password: '',
};

export default function AuthPage() {
  const navigate = useNavigate();
  const signInUser = useAuthStore((state) => state.signInUser);
  const signUpUser = useAuthStore((state) => state.signUpUser);
  const loading = useAuthStore((state) => state.loading);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        await signInUser(form.email, form.password);
      } else {
        await signUpUser(form.email, form.password, form.name);
      }
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Authentication failed.');
    }
  };

  return (
    <div className="centered-page">
      <div className="auth-card">
        <p className="eyebrow">Personal Workout Planner</p>
        <h1>{mode === 'login' ? 'Welcome back' : 'Start your training plan'}</h1>
        <p className="muted">
          Keep your workouts in one place and stay focused on your next session.
        </p>

        <div className="segmented-control">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Sign In
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Get Started
          </button>
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <label>
              <span>Name</span>
              <input
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Alex Carter"
              />
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="alex@example.com"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="At least 6 characters"
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Just a moment...' : mode === 'login' ? 'Sign In' : 'Create My Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
