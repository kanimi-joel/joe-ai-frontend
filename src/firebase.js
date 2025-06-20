// src/firebase.js

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAUG3zBqARq3FQ0EmooxgnTFGmlDFkp1Vc",
  authDomain: "joe-ai-42737.firebaseapp.com",
  projectId: "joe-ai-42737",
  storageBucket: "joe-ai-42737.appspot.com",  // 🔧 fixed typo (was `firebasestorage.app`)
  messagingSenderId: "430692671237",
  appId: "1:430692671237:web:322e5728b7dc090ed4616c",
  measurementId: "G-JFS55QD5VS"
};

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ✅ Export everything needed in App.js
export { auth, provider, signInWithPopup, signOut };


