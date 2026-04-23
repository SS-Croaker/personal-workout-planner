import { useFeedbackStore } from '../store/feedbackStore';

export default function ToastStack() {
  const toasts = useFeedbackStore((state) => state.toasts);
  const dismissToast = useFeedbackStore((state) => state.dismissToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button type="button" className="toast-dismiss" onClick={() => dismissToast(toast.id)}>
            Close
          </button>
        </div>
      ))}
    </div>
  );
}
