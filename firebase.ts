// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAMAG5K9iJOb293fW5wvD3JU-MdfR4dkVg",
  authDomain: "shogi-5f965.firebaseapp.com",
  projectId: "shogi-5f965",
  storageBucket: "shogi-5f965.appspot.com",
  messagingSenderId: "142858111231",
  appId: "1:142858111231:web:2d9ad42a8423e59395e4ca",
  measurementId: "G-6DB67N8CYE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth =  getAuth(app);
const firestore = getFirestore(app);


const signUp = async (email: string, password: string) => {
  await createUserWithEmailAndPassword(auth, email, password);
}
const signIn = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password);
}
const logOut = async () => {
  await signOut(auth)
}

export { auth, firestore, signUp, signIn, logOut };
