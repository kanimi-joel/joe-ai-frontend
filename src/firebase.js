// src/firebase.js

// Import Firebase core and required services
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Firebase project configuration (client-safe)
const firebaseConfig = {
  apiKey: "AIzaSyAUG3zBqARq3FQ0EmooxgnTFGmlDFkp1Vc",
  authDomain: "joe-ai-42737.firebaseapp.com",
  projectId: "joe-ai-42737",
  storageBucket: "joe-ai-42737.appspot.com",
  messagingSenderId: "430692671237",
  appId: "1:430692671237:web:322e5728b7dc090ed4616c",
  measurementId: "G-JFS55QD5VS"
};

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firebase Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ✅ Export everything needed across the app
export {
  auth,
  db,
  provider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
};



