// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyBvxaknC64XXchM2-vviwxfJDvyV-r_Uto",
    authDomain: "plan-1312b.firebaseapp.com",
    databaseURL: "https://plan-1312b-default-rtdb.firebaseio.com",
    projectId: "plan-1312b",
    storageBucket: "plan-1312b.firebasestorage.app",
    messagingSenderId: "917874075755",
    appId: "1:917874075755:web:abfd5bd5b01f3f2a47a92e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db;
