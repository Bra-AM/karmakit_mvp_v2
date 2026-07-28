// KarmaKit — shared UI helpers.
//
// Rule of thumb in here: user-supplied text is stored raw and escaped at render
// time, never the other way around. Escaping on save double-encodes apostrophes
// and makes the stored data wrong for every other consumer.

export function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Only http(s) links are allowed through. Without this check a submitted
// "javascript:..." URL would run as soon as someone clicked Visit Project.
export function safeUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

export function initials(name) {
  const parts = String(name || 'Guest').trim().split(/\s+/);
  return parts.map((p) => p.charAt(0)).join('').toUpperCase().slice(0, 2) || '?';
}

// Deterministic colour per name so a builder keeps the same avatar everywhere.
export function colorFor(seed) {
  const palette = ['#301F4F', '#4A2F73', '#2D6A4F', '#1B5E8C', '#8C4A1B', '#7A2E4A'];
  let hash = 0;
  for (let i = 0; i < String(seed).length; i++) {
    hash = (hash * 31 + String(seed).charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

// Replaces the old via.placeholder.com images — that service is gone, so every
// default logo used to render broken.
export function avatarMarkup(name, logoUrl, className = 'avatar-fallback') {
  const url = safeUrl(logoUrl);
  const fallback =
    `<div class="${className}" style="background:${colorFor(name)}">${esc(initials(name))}</div>`;
  if (!url) return fallback;
  return `<img src="${esc(url)}" alt="${esc(name)}" class="${className}-img"
    onerror="this.outerHTML = this.dataset.fallback" data-fallback="${esc(fallback)}">`;
}

export function formatDate(value) {
  if (!value) return 'Recently';
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleDateString();
}

export function showToast(message, type = 'success') {
  const toast = document.getElementById('success-toast');
  if (!toast) return;
  toast.querySelector('.toast-message').textContent = message;
  toast.querySelector('.toast-icon').textContent = type === 'success' ? '🎉' : '⚠️';
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

export function navigate(page) {
  document.body.classList.add('page-loading');
  setTimeout(() => {
    window.location = page;
  }, 300);
}

export function setBusy(button, busy, busyLabel = 'Working...') {
  if (!button) return;
  if (busy) {
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = `<span class="spinner"></span>${esc(busyLabel)}`;
    button.disabled = true;
  } else {
    if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
    button.disabled = false;
  }
}

// Firebase returns machine-readable codes; users should not see them.
export function authErrorMessage(error) {
  const messages = {
    'auth/invalid-email': 'That email address does not look right.',
    'auth/missing-password': 'Please enter your password.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/email-already-in-use': 'An account with that email already exists. Try signing in.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-not-found': 'Email or password is incorrect.',
    'auth/too-many-requests': 'Too many attempts. Please wait a minute and try again.',
    'auth/popup-closed-by-user': 'Sign-in window was closed before finishing.',
    'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups and retry.',
    'auth/account-exists-with-different-credential':
      'That email is already registered with a different sign-in method.',
    'auth/network-request-failed': 'Network problem. Check your connection and retry.',
    'auth/unauthorized-domain': 'This domain is not authorised in Firebase Auth settings.'
  };
  return messages[error?.code] || error?.message || 'Something went wrong. Please try again.';
}

/** Unread count on the Profile nav button. Silent when there is nothing new. */
export function renderActivityBadge(count) {
  const button = document.querySelector('.nav-btn[data-nav="profile.html"]');
  if (!button) return;
  button.querySelector('.nav-badge')?.remove();
  if (!count) return;

  const badge = document.createElement('span');
  badge.className = 'nav-badge';
  badge.textContent = count > 9 ? '9+' : String(count);
  badge.setAttribute('aria-label', `${count} new`);
  button.appendChild(badge);
}

/** "3 hours ago" reads better than a date on an activity list. */
export function timeAgo(value) {
  if (!value) return '';
  const date = value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';

  const units = [
    ['minute', 60],
    ['hour', 3600],
    ['day', 86400],
    ['week', 604800],
    ['month', 2592000],
    ['year', 31536000]
  ];

  let label = 'year';
  let size = 31536000;
  for (let i = 0; i < units.length; i++) {
    const next = units[i + 1];
    if (!next || seconds < next[1]) {
      [label, size] = units[i];
      break;
    }
  }

  const amount = Math.floor(seconds / size);
  return `${amount} ${label}${amount === 1 ? '' : 's'} ago`;
}

export function levelFor(karma) {
  if (karma >= 100) return 'Karma Master';
  if (karma >= 50) return 'Super Builder';
  if (karma >= 25) return 'Active Builder';
  if (karma >= 10) return 'Rising Star';
  if (karma >= 5) return 'Beginner';
  return 'Newbie';
}

export function rankFor(karma) {
  if (karma >= 100) return '🏆 Elite';
  if (karma >= 50) return '🥇 Gold';
  if (karma >= 25) return '🥈 Silver';
  if (karma >= 10) return '🥉 Bronze';
  return 'Unranked';
}
