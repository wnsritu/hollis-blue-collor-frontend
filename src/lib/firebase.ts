import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfnkpvXf56PRJSXtxwIVsQlcGQJVz0rq8",
  authDomain: "unik-clean-ed2ca.firebaseapp.com",
  projectId: "unik-clean-ed2ca",
  storageBucket: "unik-clean-ed2ca.firebasestorage.app",
  messagingSenderId: "10003156624",
  appId: "1:10003156624:web:80e498af459507c138d215",
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

// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyCfnkpvXf56PRJSXtxwIVsQlcGQJVz0rq8",
//   authDomain: "unik-clean-ed2ca.firebaseapp.com",
//   projectId: "unik-clean-ed2ca",
//   storageBucket: "unik-clean-ed2ca.firebasestorage.app",
//   messagingSenderId: "10003156624",
//   appId: "1:10003156624:web:80e498af459507c138d215",
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
