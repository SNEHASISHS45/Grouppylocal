import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Add this import

const firebaseConfig = {
  apiKey: "AIzaSyBfeq2fFbi_SpTWSTiqrEJ2iIqeVFC63F4",
  authDomain: "grouppy-37204.firebaseapp.com",
  projectId: "grouppy-37204",
  storageBucket: "grouppy-37204.appspot.com", // Make sure this is correct
  messagingSenderId: "1070140184180",
  appId: "1:1070140184180:web:196435fd3885bcfc832321",
  measurementId: "G-3B57BLF0ZW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Initialize and export storage

export default app;
// Cloudinary configuration (add this)
export const cloudinaryConfig = {
cloud_name: 'dzn369qpk',
api_key: '274266766631951',
api_secret: 'ThwRkNdXKQ2LKnQAAukKgmo510g',
};
