# Personal Workout Planner

Cost-efficient gym workout planner built with React, Zustand, Firebase, and Vercel.

## Local Setup

```bash
npm install
npm run dev
```

## Firebase Setup

1. Create a Firebase project.
2. Enable Email/Password in Authentication.
3. Create a Firestore database in production mode.
4. Create a Storage bucket.
5. Copy `.env.example` to `.env` and fill in the Firebase config.
6. Add the Firestore and Storage rules from the `firebase/` folder.

## Vercel Deploy

```bash
vercel
```

Add the same `VITE_FIREBASE_*` variables in the Vercel project settings, then redeploy.
