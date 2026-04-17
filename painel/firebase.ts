import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

const firebaseConfig = {
  apiKey: "AIzaSyBTF5M7HcFIvF_TbFqpG7zMjh29AXP1zzM",
  authDomain: "lotacao-753a1.firebaseapp.com",
  databaseURL: "https://lotacao-753a1-default-rtdb.firebaseio.com",
  projectId: "lotacao-753a1",
  storageBucket: "lotacao-753a1.firebasestorage.app",
  messagingSenderId: "755549088369",
  appId: "1:755549088369:web:6182fc39adbd73ea4789d0",
  measurementId: "G-3KWB2PQMCN"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const auth = firebase.auth();

export { db, auth, firebase };
