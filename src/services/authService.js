import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';
import { getFriendlyErrorMessage } from '../utils/errors';

export const authService = {
  async register(email, password, name) {
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(response.user, { displayName: name });
      }
      return response.user;
    } catch (error) {
      throw new Error(getFriendlyErrorMessage(error, 'We could not create your account right now.'));
    }
  },

  async login(email, password) {
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      return response.user;
    } catch (error) {
      throw new Error(getFriendlyErrorMessage(error, 'We could not sign you in right now.'));
    }
  },

  listen(callback) {
    return onAuthStateChanged(auth, callback);
  },

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error(getFriendlyErrorMessage(error, 'We could not sign you out right now.'));
    }
  },
};
