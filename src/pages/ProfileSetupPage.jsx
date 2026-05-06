import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useFeedbackStore } from '../store/feedbackStore';
import { useWorkoutStore } from '../store/workoutStore';
import { calculateBmi } from '../utils/bmi';

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const profile = useWorkoutStore((state) => state.profile);
  const saveProfile = useWorkoutStore((state) => state.saveProfile);
  const showToast = useFeedbackStore((state) => state.showToast);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: user?.email || '',
    dob: '',
    height_cm: '',
    weight_kg: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || user?.email || '',
        dob: profile.dob || '',
        height_cm: profile.height_cm || '',
        weight_kg: profile.weight_kg || '',
      });
    }
  }, [profile, user?.email]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const heightCm = Number(form.height_cm);
    const weightKg = Number(form.weight_kg);

    if (!form.name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!form.email.trim()) {
      setError('Please enter your email.');
      return;
    }

    if (!form.dob) {
      setError('Please select your date of birth.');
      return;
    }

    if (!heightCm || heightCm < 50 || heightCm > 250) {
      setError('Height must be between 50 and 250 cm.');
      return;
    }

    if (!weightKg || weightKg < 20 || weightKg > 350) {
      setError('Weight must be between 20 and 350 kg.');
      return;
    }

    setSaving(true);

    try {
      const bmi = calculateBmi(heightCm, weightKg);
      await saveProfile(user.uid, {
        ...form,
        height_cm: heightCm,
        weight_kg: weightKg,
        bmi,
      });
      showToast({
        type: 'success',
        message: 'Your profile is saved and ready to go.',
      });
      navigate('/', { replace: true });
    } catch (submitError) {
      const message = submitError.message || 'We couldn’t save your profile right now.';
      setError(message);
      showToast({
        type: 'error',
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page-section narrow-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Your Profile</p>
          <h2>Set up your fitness details</h2>
        </div>
        <p className="muted">
          Add a few details so your workout plan feels tailored to you.
        </p>
      </div>

      <form className="panel stack-form" onSubmit={handleSubmit}>
        <label>
          <span>Name</span>
          <input required value={form.name} onChange={(event) => handleChange('name', event.target.value)} />
        </label>

        <label>
          <span>Email</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => handleChange('email', event.target.value)}
          />
        </label>

        <label>
          <span>Date of birth</span>
          <input type="date" required value={form.dob} onChange={(event) => handleChange('dob', event.target.value)} />
        </label>

        <label>
          <span>Height (cm)</span>
          <input
            type="number"
            min="50"
            max="250"
            required
            value={form.height_cm}
            onChange={(event) => handleChange('height_cm', event.target.value)}
          />
        </label>

        <label>
          <span>Weight (kg)</span>
          <input
            type="number"
            min="20"
            max="350"
            step="0.1"
            required
            value={form.weight_kg}
            onChange={(event) => handleChange('weight_kg', event.target.value)}
          />
        </label>

        {error ? <p className="feedback-inline feedback-error">{error}</p> : null}

        {saving ? <p className="feedback-inline feedback-info">Saving your profile...</p> : null}

        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Saving your profile...' : 'Save Profile'}
        </button>
      </form>
    </section>
  );
}
