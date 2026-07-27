// KarmaKit — Firebase bootstrap
//
// Config for the karmakit-d38da project. To find these again:
//   Firebase console -> Settings -> Project settings -> General
//     -> Your apps -> SDK setup and configuration -> Config
//
// These values are PUBLIC by design. Anyone can read them in the browser and that
// is fine — they identify your project, they do not grant access to it. All real
// access control lives in firestore.rules, which runs on Google's servers.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyC0TKvo8JKCx2EPJfysvi9SORzn_T3KqnU',
  authDomain: 'karmakit-d38da.firebaseapp.com',
  projectId: 'karmakit-d38da',
  storageBucket: 'karmakit-d38da.firebasestorage.app',
  messagingSenderId: '554173245998',
  appId: '1:554173245998:web:5500af19dc1d1661454dbf'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Karma is never stored. It is derived from real documents on read, so it
// cannot be edited from the browser console. Keep these in sync with README.
export const KARMA = {
  SUBMIT: 5,
  VOTE: 2,
  COMMENT: 3
};
