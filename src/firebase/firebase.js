import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "grouppy-37204",
  storageBucket: "grouppy-37204.firebasestorage.app",
  messagingSenderId: "1070140184180",
  appId: "1:1070140184180:web:196435fd3885bcfc832321",
  measurementId: "G-3B57BLF0ZW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db instances
export const auth = getAuth(app);
export const db = getFirestore(app);

// Remove Cloudinary credentials from client-side code
// These should only be used server-side
export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
};
