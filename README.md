# 💪 Personal Workout Planner

Plan your workouts. Track your progress. Stay consistent.

A simple, fast, and mobile-friendly web app to create and manage your weekly workout routines. Designed to help you focus on training—not complexity.

---

## 🚀 Live App

👉 https://personal-workout-planner-lilac.vercel.app

---

## ✨ Features

* 🔐 User authentication (email-based)
* 🧍 Profile setup with BMI calculation
* 📅 Create and manage weekly workout plans
* 🏋️ Add unlimited exercises per workout
* ✅ Mark exercises as completed
* 📊 Track workout progress (per session)
* 🔁 Reset progress without losing your plan
* 📦 Multiple workout plans support
* ⚡ Fast performance with optimized data usage
* 📱 Mobile-friendly design

---

## 🛠 Tech Stack

* **Frontend:** React + Vite
* **State Management:** Zustand
* **Backend:** Firebase

  * Authentication
  * Firestore (Database)
  * Storage (for images)
* **Hosting:** Vercel

---

## 📸 Screens

* Dashboard with weekly workout overview
* Workout view with full exercise list
* Exercise editor with equipment & weight tracking

---

## ⚙️ Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/SS-Croaker/personal-workout-planner.git
cd personal-workout-planner
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Add environment variables

Create a `.env` file in the root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

### 4. Run locally

```bash
npm run dev
```

Open:
http://localhost:5173

---

## 🚀 Deployment

This app is deployed on Vercel.

To deploy:

```bash
npx vercel --prod
```

---

## 🔒 Security Notes

* Environment variables are not committed to the repo
* Firebase rules restrict access to authenticated users only

---

## 📌 Roadmap

* 📈 Workout history & progress tracking
* ⏱️ Timer & set tracking
* 🧠 Smart workout suggestions
* 📊 Weekly analytics
* 🌐 Custom domain & branding

---

## 🙌 Acknowledgements

Built using modern web tools with a focus on simplicity, speed, and usability.

---

## 📬 Feedback

If you have suggestions or improvements, feel free to open an issue or contribute.

---
