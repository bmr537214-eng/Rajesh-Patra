import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0011132386",
  appId: "1:804862244834:web:9c99880146ac83b412abbb",
  apiKey: "AIzaSyAqAg3YKAv4Nela39KiRRy71ZW69IMvNPI",
  authDomain: "gen-lang-client-0011132386.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-zoyasassyvoiceas-2da461c0-74e3-43bb-ab3c-3937f63aff6c",
  storageBucket: "gen-lang-client-0011132386.firebasestorage.app",
  messagingSenderId: "804862244834"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Google Sign-In helper
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Logout helper
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};
