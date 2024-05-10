import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: `${import.meta.env.VITE_FIREBASE_API_KEY}`,
  authDomain: "blog-app-14cf6.firebaseapp.com",
  projectId: "blog-app-14cf6",
  storageBucket: "blog-app-14cf6.appspot.com",
  messagingSenderId: "853886314427",
  appId: "1:853886314427:web:807455654a306f6433869e",
};

const app = initializeApp(firebaseConfig);

const provider = new GoogleAuthProvider();

const auth = getAuth();

export const authWithGoogle = async () => {
  try {
    const { user } = await signInWithPopup(auth, provider);

    return user;
  } catch (error) {
    console.log(error);
  }
};
