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
  'storage/invalid-config': 'Workout image uploads are not available right now. Firebase Storage is not configured correctly.',
  'storage/bucket-not-found': 'Workout image uploads are not available right now. The Firebase Storage bucket could not be found.',
  'storage/bucket-unreachable': 'We could not reach Firebase Storage right now. Please try again in a moment.',
  'storage/object-not-found': 'That image could not be found anymore.',
  'storage/quota-exceeded': 'Storage is temporarily full. Please try again later.',
  'storage/retry-limit-exceeded': 'Image upload could not be completed. Please try again with a different image.',
  'storage/unauthorized': 'You do not have permission to upload that image.',
  'storage/unknown': 'We could not upload that image right now.',
  'upload/invalid-image-type': 'Unsupported image format. Please use JPG, PNG, or WebP.',
  'upload/invalid-image-file': 'That file does not look like a valid image.',
  'upload/image-too-large': 'That image is too large. Please choose an image under 10 MB.',
  'upload/image-processing-timeout': 'Image preparation took too long. Please try a smaller image.',
  'upload/image-upload-timeout': 'Image upload could not be completed. Please try again.',
  'upload/save-timeout': 'Saving the workout took too long. Please try again.',
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
