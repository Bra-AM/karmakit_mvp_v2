// KarmaKit — data layer.
//
// Everything here talks to Firestore. Nothing is cached in localStorage, because
// the whole point of this rewrite is that projects, votes and feedback are
// shared between users rather than private to one browser.
//
// Karma is DERIVED, never stored: it is counted from the vote/comment/project
// documents that firestore.rules protects. There is no number a user can edit.

import { db, KARMA } from './firebase-config.js';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const FEED_LIMIT = 100;

/* ---------------------------------------------------------------- projects */

export async function createProject(user, { name, idea, link, website, logo }) {
  const ref = await addDoc(collection(db, 'projects'), {
    name,
    idea,
    link: link || '',
    website: website || '',
    logo: logo || '',
    ownerId: user.uid,
    ownerName: user.displayName || user.email.split('@')[0],
    createdAt: serverTimestamp()
  });
  return ref.id;
}

/**
 * Owners can revise a project after posting. Only these fields are writable —
 * ownerId and createdAt are deliberately absent so an edit cannot reassign a
 * project or backdate it, and firestore.rules enforces the same.
 */
export function updateProject(projectId, { name, idea, link, website, logo }) {
  return updateDoc(doc(db, 'projects', projectId), {
    name,
    idea,
    link: link || '',
    website: website || '',
    logo: logo || '',
    updatedAt: serverTimestamp()
  });
}

/**
 * Deletes the project only. Votes and comments that referenced it are left in
 * place, which keeps everyone's karma honest: feedback someone genuinely gave
 * should not be erased because the recipient removed their project.
 */
export function deleteProject(projectId) {
  return deleteDoc(doc(db, 'projects', projectId));
}

export async function getProject(projectId) {
  const snapshot = await getDoc(doc(db, 'projects', projectId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function getMyProjects(uid) {
  const snapshot = await getDocs(
    query(collection(db, 'projects'), where('ownerId', '==', uid), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * The swipe feed: newest projects, minus your own and minus anything you have
 * already voted on. Filtering client-side is fine at MVP volume; if the feed
 * outgrows FEED_LIMIT this becomes a cursor-paginated query.
 */
export async function getFeed(uid) {
  const [projectSnap, voteSnap] = await Promise.all([
    getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(FEED_LIMIT))),
    getDocs(query(collection(db, 'votes'), where('userId', '==', uid)))
  ]);

  const voted = new Set(voteSnap.docs.map((d) => d.data().projectId));
  return projectSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((project) => project.ownerId !== uid && !voted.has(project.id));
}

/* ------------------------------------------------------------------- votes */

/**
 * One vote per user per project, enforced by the document ID rather than by
 * client-side checks — a second vote overwrites the first instead of creating
 * a duplicate, so karma cannot be farmed by re-voting.
 */
export async function castVote(user, project, type) {
  await setDoc(doc(db, 'votes', `${project.id}_${user.uid}`), {
    projectId: project.id,
    projectOwnerId: project.ownerId,
    userId: user.uid,
    type, // 'like' | 'pass'
    createdAt: serverTimestamp()
  });
}

/* ---------------------------------------------------------------- comments */

/**
 * One piece of feedback per person per project, enforced by the document ID
 * rather than by client-side checks. Posting again revises what you said
 * instead of adding another +3 to your karma.
 */
export async function addComment(user, project, { text, wantsConnection }) {
  await setDoc(doc(db, 'comments', `${project.id}_${user.uid}`), {
    projectId: project.id,
    projectOwnerId: project.ownerId,
    userId: user.uid,
    authorName: user.displayName || user.email.split('@')[0],
    text,
    wantsConnection: Boolean(wantsConnection),
    createdAt: serverTimestamp()
  });
}

export async function getComments(projectId) {
  const snapshot = await getDocs(
    query(collection(db, 'comments'), where('projectId', '==', projectId), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Every piece of feedback left on any of your projects, newest first, keyed by
 * project ID. One query rather than one per project.
 */
export async function getFeedbackForOwner(uid) {
  const snapshot = await getDocs(
    query(
      collection(db, 'comments'),
      where('projectOwnerId', '==', uid),
      orderBy('createdAt', 'desc')
    )
  );

  const byProject = {};
  snapshot.docs.forEach((d) => {
    const comment = { id: d.id, ...d.data() };
    (byProject[comment.projectId] ||= []).push(comment);
  });
  return byProject;
}

/* ------------------------------------------------------------- connections */

export async function requestConnection(user, project, { email, message }) {
  await addDoc(collection(db, 'connections'), {
    projectId: project.id,
    toUserId: project.ownerId,
    fromUserId: user.uid,
    fromName: user.displayName || user.email.split('@')[0],
    fromEmail: email,
    message: message || '',
    createdAt: serverTimestamp()
  });
}

export async function getMyConnectionRequests(uid) {
  const snapshot = await getDocs(
    query(collection(db, 'connections'), where('toUserId', '==', uid), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ------------------------------------------------------------------ counts */

// Aggregation queries are billed as one read per 1000 documents matched, so
// counting is far cheaper than fetching the documents to measure their length.
function countOf(collectionName, ...constraints) {
  return getCountFromServer(query(collection(db, collectionName), ...constraints)).then((s) =>
    s.data().count
  );
}

export function countLikes(projectId) {
  return countOf('votes', where('projectId', '==', projectId), where('type', '==', 'like'));
}

export function countComments(projectId) {
  return countOf('comments', where('projectId', '==', projectId));
}

/**
 * Counted from comments, not from the connections collection. Connection
 * documents hold contact emails and are readable only by the two people
 * involved, so they cannot back a public counter on the feed card.
 */
export function countConnections(projectId) {
  return countOf(
    'comments',
    where('projectId', '==', projectId),
    where('wantsConnection', '==', true)
  );
}

export async function getProjectCounts(projectId) {
  const [likes, comments, connections] = await Promise.all([
    countLikes(projectId),
    countComments(projectId),
    countConnections(projectId)
  ]);
  return { likes, comments, connections };
}

/* ------------------------------------------------------------------- karma */

/**
 * Recomputed from source documents on every read. Matches the README table:
 * +5 per project submitted, +2 per project reviewed, +3 per feedback given.
 */
export async function getKarma(uid) {
  const [projects, votes, comments] = await Promise.all([
    countOf('projects', where('ownerId', '==', uid)),
    countOf('votes', where('userId', '==', uid)),
    countOf('comments', where('userId', '==', uid))
  ]);

  const breakdown = {
    projectsSubmitted: projects * KARMA.SUBMIT,
    projectsReviewed: votes * KARMA.VOTE,
    feedbackGiven: comments * KARMA.COMMENT
  };

  return {
    total: breakdown.projectsSubmitted + breakdown.projectsReviewed + breakdown.feedbackGiven,
    counts: { projects, votes, comments },
    breakdown
  };
}

/** Everything the profile page shows about what a builder has received. */
export async function getReceivedStats(uid) {
  const [likesReceived, feedbackReceived, connectionsMade] = await Promise.all([
    countOf('votes', where('projectOwnerId', '==', uid), where('type', '==', 'like')),
    countOf('comments', where('projectOwnerId', '==', uid)),
    countOf('connections', where('toUserId', '==', uid))
  ]);
  return { likesReceived, feedbackReceived, connectionsMade };
}

/* ----------------------------------------------------------- activity feed */

const ACTIVITY_LIMIT = 30;

/**
 * Feedback and connection requests you have received, newest first.
 *
 * There is no notifications collection and no Cloud Function writing to one.
 * Activity is derived on read from the comment and connection documents that
 * already exist, and "unread" is simply anything newer than the timestamp we
 * store when you last opened the page. Nothing to keep in sync, nothing to
 * backfill, and it cannot drift out of step with reality.
 */
export async function getActivity(uid, since = null) {
  const [commentSnap, connectionSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, 'comments'),
        where('projectOwnerId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(ACTIVITY_LIMIT)
      )
    ),
    getDocs(
      query(
        collection(db, 'connections'),
        where('toUserId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(ACTIVITY_LIMIT)
      )
    )
  ]);

  const sinceMs = since ? toMillis(since) : 0;

  const items = [
    ...commentSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        type: 'feedback',
        who: data.authorName || 'Someone',
        text: data.text,
        wantsConnection: Boolean(data.wantsConnection),
        projectId: data.projectId,
        createdAt: data.createdAt
      };
    }),
    ...connectionSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        type: 'connection',
        who: data.fromName || 'Someone',
        email: data.fromEmail,
        text: data.message,
        projectId: data.projectId,
        createdAt: data.createdAt
      };
    })
  ];

  items.forEach((item) => {
    item.isNew = toMillis(item.createdAt) > sinceMs;
  });

  items.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  return items.slice(0, ACTIVITY_LIMIT);
}

/** Firestore timestamps arrive as Timestamp, or null while a write is pending. */
function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

/**
 * How many pieces of activity arrived since `since`. Used for the header badge,
 * so it is two count queries rather than fetching the documents themselves.
 */
export async function countUnread(uid, since) {
  if (!since) {
    // Never opened the activity list: treat everything received as unread.
    const [feedback, connections] = await Promise.all([
      countOf('comments', where('projectOwnerId', '==', uid)),
      countOf('connections', where('toUserId', '==', uid))
    ]);
    return feedback + connections;
  }

  const [feedback, connections] = await Promise.all([
    countOf('comments', where('projectOwnerId', '==', uid), where('createdAt', '>', since)),
    countOf('connections', where('toUserId', '==', uid), where('createdAt', '>', since))
  ]);
  return feedback + connections;
}

/* ------------------------------------------------------------ global stats */

/**
 * The one figure that belongs to everyone. Project and feedback totals were
 * shown here too, but sitting under a user's own karma they read as personal
 * numbers — those are per-user and live on the profile instead.
 */
export function countBuilders() {
  return countOf('users');
}
