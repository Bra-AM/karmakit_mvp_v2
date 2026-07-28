# Taking KarmaKit live on karmakitapp.com

Everything in the app is built and wired up. What remains is creating your Firebase
project, pasting six config values into one file, and pointing your domain at it.

Budget about 45 minutes. Total cost: **$0/month** on Firebase's free Spark plan plus
what you already paid Namecheap for the domain.

---

## Does any of this involve GitHub?

**No.** `firebase deploy` uploads files straight from your computer to Google's
servers — GitHub is not in that path. Push to GitHub for backup and version history,
but the site goes live without it.

If you do push, turn **GitHub Pages off** afterwards (repo → Settings → Pages →
Source → None). Otherwise the old `bra-am.github.io` URL serves this new code with
broken sign-in, because that domain isn't authorised in Firebase.

---

## 1. Create the Firebase project

1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Name it `karmakit` (the project ID will look like `karmakit-a1b2c`).
3. Google Analytics is optional — skip it for now, it's one less thing to configure.

---

> **Finding things in the sidebar.** Firebase redesigned the console and the old
> **Build** menu no longer exists. Products are now grouped under *Product categories*:
>
> | What you need | Where it is now |
> |---|---|
> | Authentication | **Security → Authentication** |
> | Firestore Database | **Databases & Storage → Firestore Database** |
> | Hosting | **Hosting & Serverless → Hosting** |
>
> If a menu doesn't match this, use **Search for products** at the top of the sidebar
> and type the product name. That works regardless of console changes.

---

## 2. Turn on Authentication

1. Left sidebar → **Security → Authentication** → **Get started**.
2. You land on the **Sign-in method** tab. Enable two providers here.
3. Click **Email/Password**:
   - Toggle the **first** switch (Email/Password) to **Enabled**.
   - Leave the second switch (**Email link / passwordless**) **off** — unused.
   - **Save**.
4. Click **Add new provider → Google**:
   - Toggle **Enable**.
   - **Public-facing name**: `KarmaKit` — this appears on the Google popup, so don't
     leave it as the raw project ID.
   - **Project support email**: pick your Gmail.
   - **Save**.

Both should now show as *Enabled*.

---

## 3. Create the Firestore database

**Databases & Storage → Firestore Database → Create database.**

- **Location**: closest region to your users (North American events: `nam5 (us-central)`).
  **This cannot be changed later** — moving regions means a new project.
- **Rules mode**: **Start in production mode**. Not test mode; test mode leaves the
  database open to the entire internet for 30 days, and we deploy real rules in step 6.

The app will look completely broken immediately after this. Correct — everything is
denied until step 6.

---

## 4. Register the web app and copy your config

1. Click the **⚙ gear** next to *Project Overview* → **Project settings**.
2. Scroll to **Your apps** → click the web icon **`</>`**.
3. **App nickname**: `KarmaKit`. Leave *"Also set up Firebase Hosting"* unchecked —
   we do that from the CLI.
4. **Register app**. Firebase shows a `const firebaseConfig = { ... }` block.
5. Open `js/firebase-config.js` and replace the six `REPLACE_ME` values, keeping quotes.

These values are public and that is fine — they identify your project, they do not
grant access to it. Access control lives entirely in `firestore.rules`, which runs on
Google's servers. Don't try to hide them in environment variables; they end up in the
browser either way. If you skip this step, the app shows a red warning banner.

---

## 5. Install the Firebase CLI

```powershell
npm install -g firebase-tools
```

**Close and reopen your terminal** — `firebase` isn't on your PATH until you do.

> **Windows snag:** if you get *"firebase.ps1 cannot be loaded because running scripts
> is disabled on this system"*, run this once and reopen the terminal:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

Then link this folder to your project:

```powershell
firebase login
cd c:\Users\DELL\Documents\karma-kit\karmakit_mvp_v2
firebase use --add          # pick karmakit, alias it "default"
```

---

## 6. Deploy the security rules and indexes

This is the step that makes the app work. Until now the database denies everything.

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

The composite indexes take **2–10 minutes** to build. Until they finish the feed shows
"Could not load projects" — expected. Watch **Firestore Database → Indexes** and wait
for all six to read *Enabled*.

**What the rules enforce** (see `firestore.rules` for the detail):

- One vote per person per project, enforced by the document ID, so karma can't be farmed
  by voting repeatedly.
- You can't vote on or review your own project.
- Feedback must be at least 10 characters — the cheapest available quality floor.
- Only `http://` and `https://` links can be saved, so a submitted `javascript:` URL
  can't be planted even by calling the SDK directly.
- Connection requests (which carry email addresses) are readable only by the two people
  involved.

---

## 4. Deploy the site

```bash
firebase deploy --only hosting
```

That publishes to `https://your-project.web.app`. Check it works there before touching DNS.

> I recommend Firebase Hosting over Vercel here specifically because it lets your
> Google sign-in popup run on `karmakitapp.com` instead of `your-project.firebaseapp.com`,
> which looks far more trustworthy to users. If you'd rather use Vercel, the site is
> plain static files — drag the folder in and it works, you'll just keep the
> firebaseapp.com popup domain.

---

## 5. Connect karmakitapp.com

### In Firebase

**Hosting → Add custom domain →** enter `karmakitapp.com`. Also add `www.karmakitapp.com`
and set it to redirect to the apex.

Firebase will show you the exact DNS records to create. It gives a TXT record first to
verify ownership, then two A records.

### In Namecheap

**Domain List → Manage → Advanced DNS.**

1. Delete the default "parking page" URL redirect record if there is one — it will
   conflict.
2. Add the TXT record Firebase gave you (Host: `@`).
3. Wait for Firebase to confirm verification, then add the two A records
   (Host: `@`, Value: each IP Firebase listed).
4. Add a CNAME: Host `www`, Value `karmakitapp.com.`

Namecheap's TTL default is fine. Propagation is usually under an hour but can take up to
48. Firebase provisions the SSL certificate automatically once DNS resolves — the domain
will show "Needs setup" until then, which is normal.

### Then, back in Firebase — don't skip this

**Authentication → Settings → Authorized domains → Add domain** → `karmakitapp.com`.

Sign-in will fail with `auth/unauthorized-domain` on your real domain until you do.

---

## 6. Configure the Google sign-in consent screen

Google requires a privacy policy before it will let a real app use Google sign-in. That's
why `privacy.html` and `terms.html` exist.

In [Google Cloud Console](https://console.cloud.google.com) with your Firebase project
selected: **APIs & Services → OAuth consent screen**.

- User type: **External**
- App name: `KarmaKit`
- App home page: `https://karmakitapp.com`
- Privacy policy: `https://karmakitapp.com/privacy.html`
- Terms of service: `https://karmakitapp.com/terms.html`
- Authorized domain: `karmakitapp.com`

While the app is in **Testing** status only accounts you add as test users can sign in
with Google. Click **Publish app** to open it to everyone. Since you're only requesting
basic email and profile scopes, this does not require Google's security review.

**Before publishing, edit both legal pages** — they contain `[YOUR NAME OR COMPANY]`
placeholders, and they reference `hello@karmakitapp.com`, which you'll need to actually
set up as a working address (Namecheap sells email forwarding cheaply).

---

## 11. App Check — blocking scripted abuse

Security rules decide **what a signed-in user may do**. App Check decides **whether the
caller is your app at all**. Without it, anyone can copy the public config from
`js/firebase-config.js` and drive your database from a script: mass account creation,
bulk-reading every comment, spamming projects. The rules still hold, but nothing forces
an attacker to go through your website.

⚠️ **Do the steps in this order.** Enforcing before real traffic is verified locks out
every one of your users.

### 11a. Create a reCAPTCHA v3 key

Go to <https://www.google.com/recaptcha/admin/create>.

- Label: `KarmaKit`
- Type: **reCAPTCHA v3** (score-based). Not v2 — v3 is invisible, users see nothing.
- Domains: `karmakitapp.com`, `www.karmakitapp.com`, `karmakit-d38da.web.app`,
  `karmakit-d38da.firebaseapp.com`, `localhost`
- Submit

You get two keys. The **site key** goes in the code, the **secret key** goes to Firebase.

### 11b. Register the app in Firebase

Firebase console → **App Check** (under Security) → **Apps** tab → your web app →
**reCAPTCHA v3** → paste the **secret key** → Save.

### 11c. Put the site key in the code

In `js/firebase-config.js`, replace `REPLACE_WITH_RECAPTCHA_V3_SITE_KEY` with your
**site key**, then `firebase deploy --only hosting`.

Until that placeholder is replaced, App Check simply does not initialise — so the app
keeps working normally and nothing breaks by having this code present.

### 11d. Watch before you enforce

Open **App Check → APIs → Cloud Firestore**. It shows verified vs unverified requests.

Visit the live site, sign in, vote, leave feedback. Those should appear as **verified**
within a few minutes. Leave it collecting for **24 hours** so anyone with an open session
is counted too.

### 11e. Then enforce

Only once verified requests dominate:

- **App Check → APIs → Cloud Firestore → Enforce**
- **App Check → APIs → Authentication → Enforce** ← this is the one that stops scripted
  sign-ups, which is the main abuse vector for a public launch

From then on, requests without a valid App Check token are rejected before your rules
are even consulted.

### Developing locally afterwards

`localhost` cannot pass a real reCAPTCHA check. The code already sets the debug flag when
the hostname is `localhost` or `127.0.0.1`, so the SDK prints a debug token to the browser
console. Copy it into **App Check → Apps → (your app) → Manage debug tokens**.

Treat that token like a password — anyone holding it bypasses App Check entirely.

### Cost

reCAPTCHA v3 is free at this scale. App Check itself is free on the Spark plan.

---

## 7. Test it properly

Use two different browsers, or one normal and one incognito, so you're genuinely two users.

- [ ] Register with email + password in browser A. Check the verification email arrives.
- [ ] Sign in with Google in browser B.
- [ ] Submit a project as A.
- [ ] **As B, confirm A's project appears in the feed.** This is the single most important
      check — it's the thing the old localStorage version could never do.
- [ ] Vote on it as B. Leave feedback. Tick "I'd like to connect."
- [ ] As A, open the profile page: likes received, feedback received, and the connection
      request with B's email should all be there.
- [ ] Try to vote on your own project — it should never appear in your own feed.
- [ ] Open devtools and try `localStorage.karma = 99999`. Nothing happens: karma is counted
      from the database on every read, not stored.
- [ ] Sign out, use "Forgot your password?", confirm the reset email arrives.
- [ ] Export your data, then delete a throwaway account and confirm it's gone.

---

## Known tradeoffs

Things I chose deliberately, so they don't surprise you later:

**Votes are readable by any signed-in user.** The feed needs to count likes, and Firestore
can only count documents a user is allowed to read. This means a determined person could
work out who passed on their project. The proper fix is a stored counter updated by a Cloud
Function — but Cloud Functions force the project onto the Blaze (pay-as-you-go) plan, which
needs a credit card. Not worth it before you have users.

**Deleting your account is done from the browser.** It removes your projects, votes and
feedback one document at a time. If someone closes the tab mid-delete, a few orphaned
records could remain. Again, a Cloud Function is the robust answer once you're on Blaze.

**The feed loads the 100 newest projects at once** and filters client-side. Fine for a
hackathon. Past a few hundred projects this needs proper pagination.

**Email verification is not enforced.** New accounts get a verification email and a nudge
banner, but they can use the app immediately. If you get spam signups, the lever is in
`firestore.rules`: add `request.auth.token.email_verified == true` to the `create`
conditions for projects and comments.

**No moderation tools.** There's no way to remove someone else's abusive project except
through the Firebase console. Worth building before a large public event.

---

## Free tier limits

Firestore's Spark plan gives you 50,000 reads and 20,000 writes per day. A single user
browsing roughly 20 projects and leaving a few comments costs well under 100 reads, so
you have room for several hundred daily active users before anything costs money.

**Firebase does not pause projects for inactivity** — this is why we moved off Supabase,
whose free tier suspends a project after 7 quiet days.

If you outgrow the free tier, the Blaze plan is pay-as-you-go and bills pennies at this
scale — but set a budget alert in the Google Cloud console the day you upgrade.
