import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDKyRWudullKQldJAbR0PZZnNcFegcu7oc",
  authDomain: "nvl-vpp-app.firebaseapp.com",
  databaseURL: "https://nvl-vpp-app-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nvl-vpp-app",
  storageBucket: "nvl-vpp-app.firebasestorage.app",
  messagingSenderId: "708334236423",
  appId: "1:708334236423:web:f40e3f43d1cafb8b39cba2",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
