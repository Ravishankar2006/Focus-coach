import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDa3DKeikvncv6eXzBNUffwO7hKmtGyE_s",
  authDomain: "focus-coach-cf264.firebaseapp.com",
  projectId: "focus-coach-cf264",
  storageBucket: "focus-coach-cf264.firebasestorage.app",
  messagingSenderId: "563569088098",
  appId: "1:563569088098:web:bccd3cc103e9ad16c2e33b",
  measurementId: "G-8QPNBFYFHC"
};

const app = initializeApp(firebaseConfig);

// EXPORT THESE (this was missing!)
export const auth = getAuth(app);
export const db = getFirestore(app);
