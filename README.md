<div align="center">

<img src="public/screenshots/login.png" alt="CodeVault Login Banner" width="100%"/>

# ⚡ CodeVault — Lab Notebook & Dev Ecosystem

**A state-of-the-art dark-mode practical notebook, real-time code collaboration hub, and native mobile lab for college programming labs.**

[![Status](https://img.shields.io/badge/Status-Active_Beta-c8ab7e?style=for-the-badge&logo=zap&logoColor=121212)](https://github.com/GajjarKashyap/CodeValut)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime_&_Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android_Native-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

### 🔥 **ANNOUNCEMENT: We soon Drop Something Big** 🔥
> *Stay tuned! We are currently working on groundbreaking next-generation updates and massive features that will change how you store, collaborate, and execute your practical code. Watch this repository closely.*

</div>

---

## 🌟 What is CodeVault?

**CodeVault** bridges the gap between old-fashioned paper lab notebooks and modern software engineering practices. Designed specifically for university computer science and IT students, CodeVault allows you to write, format, tag, and execute **Java** and **MongoDB** practical sessions in a sleek dark-mode IDE interface, share them instantly via **QR codes**, discuss code in **real-time group channels**, and access everything on the go via our **Native Android App**.

---

## 📸 Platform Preview

<table>
  <tr>
    <td><img src="public/screenshots/dashboard.png" alt="Dashboard" /></td>
    <td><img src="public/screenshots/session_editor.png" alt="Session Editor" /></td>
  </tr>
  <tr>
    <td align="center"><b>Dashboard</b> — Live statistics, quick access & announcements</td>
    <td align="center"><b>Monaco IDE Editor</b> — VS Code syntax highlighting + simple toggle</td>
  </tr>
  <tr>
    <td><img src="public/screenshots/session_list.png" alt="Session List" /></td>
    <td><img src="public/screenshots/search.png" alt="Search" /></td>
  </tr>
  <tr>
    <td align="center"><b>Practical Sessions</b> — Tagged cards, favorites & quick copy</td>
    <td align="center"><b>Real-time Search</b> — Instant filtering with topic & subject chips</td>
  </tr>
</table>

---

## ✨ Key Features & Latest Updates

### 📱 1. Native Android Mobile App (`v1.4+`)
- **Capacitor Native Shell:** Full-featured Android application built inside the `mobile-app/` ecosystem.
- **Biometric & PIN Lock Screen:** Protect your code snippets and chats with native fingerprint, face unlock, or custom PIN codes.
- **Native Push Notifications:** Instant background alerts when someone messages your group room or mentions you.
- **Dedicated Download Portal:** Download the latest production APK directly from `/download` with one click.

---

### 💬 2. Real-Time Collaboration & QR Sharing (`v1.4+`)
- **Instant QR Code Sharing:** Generate and scan custom QR codes right on the chat dashboard or inside group rooms. Invite classmates or join study groups in seconds!
- **Bulk Selection & Deletion:** Turn on **Select Mode** in your chat list (`CheckSquare`) to check off multiple groups/DMs and delete or leave them in a single batch.
- **Interactive CodeToolbar:** Send syntax-highlighted code snippets inside chat rooms (`ChatRoom.jsx`) equipped with a dedicated toolbar for quick copy, language tags, and formatting.
- **Emoji Reactions & Thread Replies:** Quote specific messages and react with live emojis (`👍 ❤️ 😂 😮 😢 👏`) that sync in real-time across all devices.
- **Always-Visible Controls:** Prominent, styled `[Delete]` buttons on every chat card for effortless cleanup.

---

### 🛡️ 3. Rich Error Shield & Crash Diagnostics (`v1.4+`)
- **`404 Page Not Found`:** Includes an interactive vault search box directly on the error screen so you never hit a dead end.
- **`403 Access Denied`:** Amber glowing terminal security check (`chmod 700 / permission denied`) when accessing locked or admin-only resources.
- **`500 Runtime Exception`:** Global `ErrorBoundary` with a one-click **Copy Error Log** button to grab stack traces cleanly, plus **Restart & Clear Cache** options.
- **`503 Offline Mode`:** Live connection diagnostic ping (`api.supabase.co`) with an automated connection restoration monitor.

---

### 💻 4. Pro Code Editor & Vault Management
- **Monaco Engine:** Dual-mode editor supporting full VS Code IntelliSense for Java & JS, plus a lightweight textarea mode for low-end mobile devices.
- **Smart Filtering:** Filter practicals by `Java`, `MongoDB`, `Favorites`, or `Shared` status.
- **Custom Tagging & Search:** Add custom comma-separated tags and find any practical instantly with debounced search.
- **Export & Share:** Public share links (no login required for viewers) and one-click plain text (`.txt`) downloads.

---

### 👑 5. Admin Control Center
- **Student Activity Directory:** Comprehensive view of all registered students and their total/subject session counts.
- **Avatar Moderation & Audit Logs:** Remove inappropriate profile pictures with a single click, automatically recorded in `audit_logs`.
- **Global Broadcast Tool:** Send high-priority announcement banners to every student's notification bell in real-time.
- **Remote Force Logout:** Terminate stale or unauthorized user sessions across all devices.

---

### 🎨 6. Multi-Theme Engine
Switch between four curated aesthetic profiles in your **Settings**:
* 🟡 **Original Gold:** Classic terminal dark with warm amber/gold accents (`#c8ab7e`)
* 🔵 **Ocean Blue:** Deep sapphire navy with electric cyan highlights
* 🟢 **Emerald Hack:** Cyberpunk terminal green matrix look
* ⚪ **Pearl Light:** Crisp, clean high-contrast light mode with violet accents

---

## 🏗️ Technical Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend Core** | React 19 + Vite 8.0 |
| **Routing** | React Router v7 (`HashRouter` for GitHub Pages & Android compatibility) |
| **Styling & UI** | Tailwind CSS v4 + Glassmorphism + Lucide Icons |
| **Code Editor** | `@monaco-editor/react` (VS Code Editor Engine) |
| **Backend & Auth** | Supabase (PostgreSQL, Row Level Security, Realtime WebSockets, Storage) |
| **Mobile Runtime** | Capacitor JS (Android SDK, Native Notifications, Splash & Lock Screen) |
| **Hosting & CI/CD** | GitHub Pages + Automated Production Builds |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v18 or higher
- A **Supabase** Project (`https://supabase.com`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/GajjarKashyap/CodeValut.git
cd CodeValut
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Development Server
```bash
# Start Web Dev Server
npm run dev

# Build and sync for Android Mobile App
cd mobile-app
npm install
npx cap sync android
```

### 4. Build & Deploy to Production
```bash
# Verify clean syntax and build
npm run build

# Deploy live to GitHub Pages
npm run deploy
```

---

## 🗄️ Database Schema Summary

CodeVault uses **PostgreSQL** with Row Level Security (RLS) enabled across all tables:
- **`sessions`:** Stores student code, aims, outputs, notes, tags, subject categorization (`Java` | `MongoDB`), and share UUIDs.
- **`profiles`:** Stores custom usernames, display names, and public avatar URLs.
- **`groups` & `group_members`:** Manages chat rooms, direct messages (`is_direct_message`), and role-based permissions (`admin` | `member`).
- **`group_messages`:** Stores real-time chat messages, code snippet payloads, and emoji reactions (`reactions` JSONB).
- **`notifications`:** Real-time push alerts (`announcement`, `reply`, `mention`, `moderation`).
- **`audit_logs`:** Immutable record of admin actions and security checks.

---

## 👨‍💻 Developer & Creator

<div align="center">

**Kashyap Gajjar**  
*Lead Architect, Designer & Full-Stack Developer*

[![GitHub](https://img.shields.io/badge/GitHub-GajjarKashyap-181717?style=flat-square&logo=github)](https://github.com/GajjarKashyap)

---

**⚡ In Beta Phase — Progress is safe, built with passion for college students.**  
*Remember: We soon Drop Something Big! Keep your repositories updated.*

</div>
