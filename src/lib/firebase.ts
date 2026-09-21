import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCfnkpvXf56PRJSXtxwIVsQlcGQJVz0rq8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hollis-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hollis-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hollis-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "10003156624",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:10003156624:web:80e498af459507c138d215",
};

// ✅ Check if already initialized
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log(
    "✅ Firebase initialized with project:",
    firebaseConfig.projectId,
  );
} else {
  app = getApps()[0];
  console.log("✅ Using existing Firebase instance:", app.options.projectId);
}

export const auth = getAuth(app);

// ✅ Debug: Log auth state
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("✅ User signed in:", user.phoneNumber);
  } else {
    console.log("❌ No user signed in");
  }
});


