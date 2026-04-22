
// Access the global firebase object loaded via scripts in index.html
const firebase = (window as any).firebase;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDn_xnhOl9oxHrY5CMDCujVtt8edh8dexQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "boradevan-546c3.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://boradevan-546c3-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "boradevan-546c3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "boradevan-546c3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1013849550765",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1013849550765:web:9e41ed68858fb02e80fb24",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-M52ZYDNDMG"
};

let db: any;
let auth: any;

if (firebase) {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    // Safety check: ensure database module is attached
    if (firebase.database) {
        db = firebase.database();
    } else {
        console.error("Firebase Database module not found.");
    }

    if (firebase.auth) {
        auth = firebase.auth();
    }
} else {
    console.error("Firebase SDK not loaded");
}

export { db, auth, firebase };
