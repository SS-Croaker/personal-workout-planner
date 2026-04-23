import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';

export const authService = {
  async register(email, password, name) {
    const response = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(response.user, { displayName: name });
    }
    return response.user;
  },

  async login(email, password) {
    const response = await signInWithEmailAndPassword(auth, email, password);
    return response.user;
  },

  listen(callback) {
    return onAuthStateChanged(auth, callback);
  },

  async logout() {
    await signOut(auth);
  },
};
