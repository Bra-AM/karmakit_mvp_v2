# 🚀 KarmaKit

**Help builders get users and validate ideas**

KarmaKit is a pop-up feedback exchange platform built for hackathons, demo days, and startup communities. Builders get feedback. Reviewers earn Karma Points.

**Live at https://karmakitapp.com**

Deploying it yourself? See **[SETUP.md](SETUP.md)**.

## 🎯 Problem Statement

Hackers need users, testers, and feedback, but it's hard to get honest, quick interactions and hackathon organizers lack real-time data on attendee participation.

## 💡 Solution

KarmaKit is a web/mobile pop-up where hackathon participants and founders can instantly:

- **Post their projects or app ideas**
- **Request and receive feedback, votes, and connections** in real-time
- **Earn karma points** by testing, commenting, or connecting with instant rewards and recognition
- **Organizers** gain live data on project engagement, participation, and user feedback

## 🔥 Features

### Core Functionality
- ✅ **Swipe Interface** - Browse through project cards with smooth animations
- ✅ **Balanced Karma System** - Equal rewards for honest feedback
- ✅ **Real-time Feedback** - Leave comments and connect with builders
- ✅ **Project Submission** - Easy form to showcase your innovation
- ✅ **User Profiles** - Track your karma, projects, and achievements
- ✅ **Connection Requests** - Network with other builders
- ✅ **Data Export** - Download your profile and project data

### Enhanced Experience
- 🎨 **Beautiful UI** - Modern, responsive design that works on all devices
- ⚡ **Fast & Smooth** - Optimized performance with loading states
- 🔒 **Privacy Controls** - Manage your visibility and connection preferences
- 📊 **Analytics Dashboard** - Track engagement and community stats
- 🏆 **Achievement System** - Level up from Newbie to Karma Master
- 💾 **Data Management** - Export or clear your data anytime

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, vanilla JavaScript (ES modules) — no build step
- **Fonts**: Google Fonts (Poppins)
- **Auth**: Firebase Authentication (email + password, and Google sign-in)
- **Database**: Cloud Firestore, with access controlled by `firestore.rules`
- **Hosting**: Firebase Hosting

## 🚀 Quick Start

### Deploying your own instance

Full walkthrough in **[SETUP.md](SETUP.md)**. The short version:

```bash
npm install -g firebase-tools
firebase login

# 1. Create a Firebase project, enable Email/Password + Google auth,
#    and create a Firestore database in production mode.
# 2. Paste your web config into js/firebase-config.js
# 3. Then:
firebase deploy
```

### Local development

The app uses ES modules, so it must be served over HTTP — opening `index.html`
directly from the filesystem will fail on CORS.

```bash
git clone https://github.com/Bra-AM/karmakit_mvp_v2.git
cd karmakit_mvp_v2
python -m http.server 8000
# then visit http://localhost:8000/login.html
```

Add `localhost` under **Firebase Console → Authentication → Settings →
Authorized domains** so sign-in works locally.

## 📱 Usage

### For Participants

1. **Browse Projects** - Swipe through project cards
2. **Give Feedback** - Click "Give Feedback" to leave comments
3. **Connect** - Check "I'd like to connect" to network with builders
4. **Earn Karma** - Get points for every interaction:
   - 👀 **+2 karma** for reviewing projects (honest feedback encouraged)
   - ❤️ **+2 karma** for liking projects (same as reviewing to prevent bias)
   - 💬 **+3 karma** for giving detailed feedback
   - 🚀 **+5 karma** for submitting projects

### For Builders

1. **Submit Project** - Share your innovation via the submit form
2. **Get Feedback** - Receive comments and likes from the community
3. **Track Progress** - Monitor engagement in your profile
4. **Connect** - Network with other builders and potential users

### For Organizers

- **Live Stats** - View real-time engagement metrics
- **Leaderboards** - Track top feedback givers and active builders
- **Data Export** - Download participation data for analysis

## 🏆 **KarmaKit Level System**

| Level | Karma Points | Badge | Description |
|-------|-------------|-------|-------------|
| **🥱 Newbie** | 0-4 points | Bronze | Just getting started |
| **🌱 Beginner** | 5-9 points | Bronze | Learning the ropes |
| **⭐ Rising Star** | 10-24 points | 🥉 Bronze | Making an impact |
| **🚀 Active Builder** | 25-49 points | 🥈 Silver | Consistently engaged |
| **💪 Super Builder** | 50-99 points | 🥇 Gold | Community champion |
| **👑 Karma Master** | 100+ points | 🏆 Elite | Ultimate contributor |

## 🎯 **How to Earn Karma Points:**

- **👀 Browse Projects** → +2 karma (click "Maybe Later")
- **❤️ Like Projects** → +2 karma (click "Love This!")
- **💬 Give Feedback** → +3 karma (leave comments)
- **🚀 Submit Projects** → +5 karma (share your work)

*Both browsing actions give equal karma to encourage honest feedback rather than gaming the system.*

## 🏗 File Structure

```
karmakit/
├── login.html              # Landing page + sign in / register
├── index.html              # Project feed (requires sign-in)
├── submit.html             # Project submission form
├── profile.html            # Profile, karma breakdown, connection requests
├── privacy.html            # Privacy policy (required for Google sign-in)
├── terms.html              # Terms of service
├── js/
│   ├── firebase-config.js  # Your Firebase project config — edit this
│   ├── auth.js             # Sign in, register, session guard
│   ├── api.js              # All Firestore reads and writes
│   └── ui.js               # Escaping, avatars, toasts, shared helpers
├── firestore.rules         # Security rules — the real access control
├── firestore.indexes.json  # Composite indexes the queries need
├── firebase.json           # Hosting + Firestore deploy config
├── style.css               # Complete styling and responsive design
├── karmakit-logo.png       # App logo
├── SETUP.md                # Deployment walkthrough
└── readme.md               # This file
```

### How karma is calculated

Karma is **never stored**. It's counted from the vote, comment and project
documents every time a page loads:

```
karma = 5 × (projects submitted)
      + 2 × (projects reviewed)
      + 3 × (feedback given)
```

Because the source documents are protected by `firestore.rules` — one vote per
person per project, no reviewing your own work, a 10-character minimum on
feedback — there is no number a user can edit to inflate their score.

## 🎨 Customization

### Branding
- Replace `karmakit-logo.png` with your event/organization logo
- Update colors in `style.css` CSS variables:
  ```css
  :root {
    --primary: #301F4F;      /* Main brand color */
    --accent: #F7C94B;       /* Karma/accent color */
    --bg-start: #f8f6fc;     /* Background gradient start */
    --bg-end: #e8e1f5;       /* Background gradient end */
  }
  ```

### Content
- Edit default projects in `index.html` (search for `defaultCompanies`)
- Modify karma point values for different actions
- Update text and messaging throughout the app

## 🌟 Use Case Examples

**Team Alpha** posts their MVP link → **8 people** test and rate it within 15 minutes

**Active user** gives 5 feedbacks → earns enough karma to **get a hoodie**

**Organizers** display a **live leaderboard** of "Top Feedback Givers" during awards

## 📊 Market Opportunity

### Total Addressable Market (TAM)
- Global hackathon market: **$1.523 billion** (2023)
- Projected growth: **15.1% CAGR** to **$5.143 billion** by 2031

### Serviceable Available Market (SAM)  
- **90K+ participants/year** in North America hackathons, university accelerators, and startup bootcamps

### Serviceable Obtainable Market (SOM)
- Target: **300 hackathon events** in first year
- Expected: **10-20K users** through partnerships

## 💰 Revenue Models

- **Event Sponsorships** - Organizers pay to offer KarmaKit at their event
- **Custom Engagement Packages** - Branded karma rewards (e.g., "Free pizza for top feedback giver sponsored by GitHub")
- **Premium Analytics** - Sell engagement insights to sponsors and schools
- **Freemium Model** - Free for smaller events, tiered pricing based on event size

## 🔮 Future Roadmap

### Phase 1
- ✅ Core feedback and karma system
- ✅ Mobile-responsive design
- ✅ Balanced karma rewards

### Phase 2 (Current)
- ✅ Real backend with database (Cloud Firestore)
- ✅ User authentication (email + password, Google sign-in)
- ✅ Server-enforced karma that can't be gamed
- 🔄 Real-time notifications
- 🔄 Organizer analytics dashboard
- 🔄 Moderation tools

### Phase 3 (Future)
- 🔄 Slack/Discord bot integration
- 🔄 API for dev tool integrations
- 🔄 Permanent feedback marketplace for post-hackathon
- 🔄 White-label enterprise solutions

## 🛡 Privacy & Security

- **Server-enforced rules** - `firestore.rules` decides who can read and write what;
  the browser code can't be used to talk it out of that
- **Emails stay private** - shared only when you send someone a connection request
- **Privacy controls** - users control connection and visibility preferences
- **Data export** - one-click JSON export of everything held about you
- **Account deletion** - removes your profile, projects, votes and feedback

Known tradeoffs (votes are visible to signed-in users, email verification isn't
enforced, no moderation tooling yet) are documented honestly in
[SETUP.md](SETUP.md#known-tradeoffs).

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and structure
- Test on mobile and desktop devices
- Ensure accessibility compliance
- Add appropriate comments for complex logic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Built With 💛

Created at **SpurHacks 2025** with love for the builder community.

---

## 🚀 Ready to Launch?

Follow **[SETUP.md](SETUP.md)** — Firebase project, security rules, custom domain,
Google consent screen, and a test checklist that catches the things that actually
break on launch day.

**Live URL**: https://karmakitapp.com

---

### 💬 Questions or Issues?

- Open an issue on GitHub
- Contact us at hello@karmakitapp.com

**Let's build the future of feedback together!** 🚀✨

## 🎯 **Why Balanced Karma?**

We implemented **equal karma rewards** (+2 for both "Maybe Later" and "Love This") to:

- ✅ **Encourage honest feedback** - No bias toward positive reactions
- ✅ **Prevent gaming** - Users can't farm points by spamming likes  
- ✅ **Maintain engagement** - Still rewards every interaction
- ✅ **Focus on quality** - Detailed feedback (+3) remains the highest reward

This creates a healthier feedback ecosystem where builders get genuine reactions rather than inflated likes!
   
