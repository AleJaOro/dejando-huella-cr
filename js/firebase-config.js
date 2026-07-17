// Firebase configuration — Dejando Huella CR
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-VQ9oNoMnNmaq1-WyOct6DF8C1NQ_sAo",
  authDomain: "dejando-huella-d3054.firebaseapp.com",
  projectId: "dejando-huella-d3054",
  storageBucket: "dejando-huella-d3054.firebasestorage.app",
  messagingSenderId: "628016442854",
  appId: "1:628016442854:web:57deee57f12776d84dfa27",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ANIMALS_COLLECTION = "animales";

export {
  auth,
  db,
  ANIMALS_COLLECTION,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
};
