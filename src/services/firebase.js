import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAw2_cfR2C9qGS9bNYfI3VGCCE5w93CpWM",
  authDomain: "luma-1e4b4.firebaseapp.com",
  projectId: "luma-1e4b4",
  storageBucket: "luma-1e4b4.firebasestorage.app",
  messagingSenderId: "691758203798",
  appId: "1:691758203798:web:4829582852e36ade7013b7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

export const provider =
  new GoogleAuthProvider();