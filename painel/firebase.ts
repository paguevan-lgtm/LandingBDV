
// Access the global firebase object loaded via scripts in index.html
const firebase = (window as any).firebase;

const firebaseConfig = {
  apiKey: "AIzaSyDn_xnhOl9oxHrY5CMDCujVtt8edh8dexQ",
  authDomain: "boradevan-546c3.firebaseapp.com",
  databaseURL: "https://boradevan-546c3-default-rtdb.firebaseio.com",
  projectId: "boradevan-546c3",
  storageBucket: "boradevan-546c3.firebasestorage.app",
  messagingSenderId: "1013849550765",
  appId: "1:1013849550765:web:9e41ed68858fb02e80fb24",
  measurementId: "G-M52ZYDNDMG"
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
