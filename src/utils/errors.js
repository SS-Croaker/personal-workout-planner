const FIREBASE_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'That email is already in use. Try signing in instead.',
  'auth/invalid-credential': 'Your email or password looks incorrect. Please try again.',
  'auth/invalid-email': 'Enter a valid email address to continue.',
  'auth/network-request-failed': 'We could not reach Firebase. Check your connection and try again.',
  'auth/too-many-requests': 'Too many attempts right now. Please wait a moment and try again.',
  'auth/user-disabled': 'This account is currently disabled. Please contact support.',
  'auth/user-not-found': 'We could not find an account with that email.',
  'auth/wrong-password': 'Your email or password looks incorrect. Please try again.',
  'permission-denied': 'You do not have permission to access this data right now.',
  'storage/network-request-failed': 'Image upload failed because the network connection was interrupted.',
  'storage/object-not-found': 'That image could not be found anymore.',
  'storage/quota-exceeded': 'Storage is temporarily full. Please try again later.',
  'storage/retry-limit-exceeded': 'Image upload took too long. Please try again with a smaller image.',
  'storage/unauthorized': 'You do not have permission to upload that image.',
  'storage/unknown': 'We could not upload that image right now.',
  unavailable: 'The service is temporarily unavailable. Please try again in a moment.',
};

export function getFriendlyErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error.code && FIREBASE_ERROR_MESSAGES[error.code]) {
    return FIREBASE_ERROR_MESSAGES[error.code];
  }

  if (error.code === 'permission-denied') {
    return FIREBASE_ERROR_MESSAGES['permission-denied'];
  }

  if (typeof error.message === 'string' && error.message.trim()) {
    const message = error.message.trim();
    if (message.toLowerCase().includes('permission')) {
      return FIREBASE_ERROR_MESSAGES['permission-denied'];
    }
    return message;
  }

  return fallback;
}
