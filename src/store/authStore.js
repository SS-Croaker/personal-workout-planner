import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set) => ({
  user: null,
  authReady: false,
  loading: false,

  initializeAuth: () =>
    authService.listen((user) => {
      set({
        user: user || null,
        authReady: true,
        loading: false,
      });
    }),

  signInUser: async (email, password) => {
    set({ loading: true });
    try {
      const user = await authService.login(email, password);
      set({ user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signUpUser: async (email, password, name) => {
    set({ loading: true });
    try {
      const user = await authService.register(email, password, name);
      set({ user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signOutUser: async () => {
    await authService.logout();
    set({ user: null });
  },
}));
