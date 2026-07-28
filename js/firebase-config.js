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
import {
  initializeAppCheck,
  ReCaptchaV3Provider
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js';
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

/* --------------------------------------------------------------- App Check */
//
// App Check proves a request came from THIS website rather than from a script
// using our public config. The security rules decide what a user may do;
// App Check decides whether the caller is our app at all. Without it, mass
// account creation and bulk scraping only need a copy of the config above.
//
// Setup and the enforcement order are documented in SETUP.md, section 11.
// Getting that order wrong locks out real users, so read it before enforcing.

const RECAPTCHA_SITE_KEY = 'REPLACE_WITH_RECAPTCHA_V3_SITE_KEY';

if (RECAPTCHA_SITE_KEY !== 'REPLACE_WITH_RECAPTCHA_V3_SITE_KEY') {
  // On localhost the reCAPTCHA check cannot succeed, so the SDK prints a debug
  // token to the console instead. Register that token under App Check -> Apps
  // -> Manage debug tokens to keep developing once enforcement is on.
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    // Never let an App Check misconfiguration take the whole app down. Until
    // enforcement is switched on in the console, requests still succeed.
    console.error('App Check failed to initialise', error);
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);

// Karma is never stored. It is derived from real documents on read, so it
// cannot be edited from the browser console. Keep these in sync with README.
export const KARMA = {
  SUBMIT: 5,
  VOTE: 2,
  COMMENT: 3
};
