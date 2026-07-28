// KarmaKit — authentication.
//
// Two sign-in methods: email + password, and Google. Both land on the same
// users/{uid} document so the rest of the app never cares which was used.

import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc,
  getDoc,
  setDoc,
  deleteField,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const googleProvider = new GoogleAuthProvider();

/**
 * Creates users/{uid} on first sign-in. Safe to call on every sign-in.
 *
 * Deliberately stores NO email address. This document is readable by every
 * signed-in user so that display names can appear on projects, which means
 * anything in here is effectively public. Email lives in Firebase Auth and
 * reaches another person only when you send them a connection request.
 */
async function ensureUserDoc(user, extras = {}) {
  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    await setDoc(ref, {
      displayName: extras.displayName || user.displayName || user.email.split('@')[0],
      company: extras.company || '',
      bio: '',
      allowConnections: true,
      showEmail: false,
      createdAt: serverTimestamp()
    });
    return;
  }

  const data = snapshot.data();
  const patch = {};

  // Google may have a name we did not have at registration time.
  if (!data.displayName && user.displayName) patch.displayName = user.displayName;

  // Scrubs the email that older versions of this app stored here. Runs once
  // per account, the next time that person signs in.
  if ('email' in data) patch.email = deleteField();

  if (Object.keys(patch).length) await setDoc(ref, patch, { merge: true });
}

export async function registerWithEmail({ email, password, displayName, company }) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  await ensureUserDoc(user, { displayName, company });
  // Not enforced yet, but it gives you a spam lever later — see SETUP.md.
  sendEmailVerification(user).catch(() => {});
  return user;
}

export async function loginWithEmail({ email, password }) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(user);
  return user;
}

export async function loginWithGoogle() {
  const { user } = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(user);
  return user;
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export function resendVerification() {
  return auth.currentUser ? sendEmailVerification(auth.currentUser) : Promise.reject();
}

export async function logout() {
  await signOut(auth);
  window.location = 'login.html';
}

/**
 * Resolves once Firebase has restored the session. Every app page calls this
 * before rendering, otherwise a refresh briefly looks like a signed-out user.
 */
export function currentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/** Redirects to the login page when signed out. Returns the user otherwise. */
export async function requireAuth() {
  const user = await currentUser();
  if (!user) {
    const target = encodeURIComponent(window.location.pathname.split('/').pop() || 'index.html');
    window.location = `login.html?next=${target}`;
    return null;
  }
  return user;
}

export async function getProfile(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export function saveProfile(uid, data) {
  return setDoc(
    doc(db, 'users', uid),
    {
      ...data,
      // Always strips the email an older version of this app stored here. The
      // rules now reject any user document containing one, so a merge that left
      // a legacy value in place would fail the write.
      email: deleteField(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

/**
 * Records that the user has looked at their activity list. Everything received
 * after this timestamp counts as unread — that one field is the entire
 * notification system's state.
 */
export function markActivitySeen(uid) {
  return setDoc(
    doc(db, 'users', uid),
    { lastSeenActivityAt: serverTimestamp(), email: deleteField() },
    { merge: true }
  );
}

/** Nudge unverified accounts without blocking them. */
export function renderVerifyBanner(user) {
  if (!user || user.emailVerified) return;
  if (user.providerData.some((p) => p.providerId === 'google.com')) return;

  const banner = document.createElement('div');
  banner.className = 'verify-banner';
  banner.innerHTML =
    '<span>Please verify your email to secure your account.</span>' +
    '<button type="button" class="link-btn" id="resend-verify">Resend email</button>';
  document.body.prepend(banner);

  banner.querySelector('#resend-verify').onclick = async (event) => {
    event.target.disabled = true;
    try {
      await resendVerification();
      event.target.textContent = 'Sent — check your inbox';
    } catch {
      event.target.textContent = 'Could not send, try later';
    }
  };
}
