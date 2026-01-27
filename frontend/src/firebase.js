import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD5d6FtAzmUGM1DSn8DwTTDodP4IYpHzkk",
  authDomain: "civic-d5336.firebaseapp.com",
  projectId: "civic-d5336",
  storageBucket: "civic-d5336.firebasestorage.app",
  messagingSenderId: "1037936514847",
  appId: "1:1037936514847:web:0a0ebde9903c0f2b7c22a",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable local persistence for auth
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((error) => {
  if (error.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence disabled');
  } else if (error.code === 'unimplemented') {
    console.warn('Browser doesn\'t support persistence');
  }
});
