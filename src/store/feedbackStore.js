import { create } from 'zustand';

let toastCounter = 0;

export const useFeedbackStore = create((set, get) => ({
  toasts: [],

  showToast: ({ type = 'success', message, duration = 2800 }) => {
    const id = `toast-${Date.now()}-${toastCounter += 1}`;

    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));

    window.setTimeout(() => {
      get().dismissToast(id);
    }, duration);
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
