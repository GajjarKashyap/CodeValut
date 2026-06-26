<div align="center">

<img src="public/screenshots/login.png" alt="CodeVault Login" width="100%"/>

# ⚡ CodeVault — Lab Notebook

**A premium dark-mode practical notebook for college programming labs**

[![Beta](https://img.shields.io/badge/Status-Beta-c8ab7e?style=for-the-badge&logo=zap&logoColor=121212)](https://github.com/GajjarKashyap/CodeValut)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

> **In Beta Phase — Progress is safe but app changes every day.**
> *Dev: Kashyap Gajjar*

</div>

---

## 📸 Screenshots

<table>
  <tr>
    <td><img src="public/screenshots/dashboard.png" alt="Dashboard" /></td>
    <td><img src="public/screenshots/session_editor.png" alt="Session Editor" /></td>
  </tr>
  <tr>
    <td align="center"><b>Admin Dashboard</b> — Student Activity Directory</td>
    <td align="center"><b>Session Editor</b> — Monaco + Simple editor toggle</td>
  </tr>
  <tr>
    <td><img src="public/screenshots/session_list.png" alt="Session List" /></td>
    <td><img src="public/screenshots/search.png" alt="Search" /></td>
  </tr>
  <tr>
    <td align="center"><b>Java Sessions</b> — Cards with tags & favorites</td>
    <td align="center"><b>Search</b> — Real-time with filter chips</td>
  </tr>
</table>

---

## ✨ Features

### 📝 Core
- **Session Management** — Create, edit, archive, and restore lab sessions
- **Subject Filtering** — Separate views for Java and MongoDB practicals
- **Favorites** — Star important sessions for quick access
- **Archive** — Soft-delete sessions, restore or permanently delete later

### 💻 Code Editor
- **Monaco Editor** — Full VS Code-style editor with Java/JS syntax highlighting
- **Simple Editor** — Lightweight textarea fallback, perfect for mobile or low-resource devices
- **Tab Indentation** — Tab key inserts 4 spaces in simple mode
- **Ctrl+S** — Save session with keyboard shortcut from anywhere

### 🔍 Search & Discovery
- **Real-time Search** — Debounced live search by title and topic
- **Filter Chips** — Quick filter by All / Java / MongoDB / Favorites
- **Tag System** — Add comma-separated tags to any session, visible in all views

### 📤 Share & Export
- **Share to Web** — Toggle public sharing; anyone with the link can view the session (no login required)
- **Download TXT** — Export session as a plain text file
- **Copy Buttons** — Copy code, output, or notes to clipboard with one click

### 💬 Real-time Chat
- **Group Chats** — Admin can create named group rooms for any subject or topic
- **Direct Messages** — One-to-one private messaging between any two students
- **Global Rooms** — Broadcast channels where all students are auto-joined
- **Code Snippets in Chat** — Share a code session directly inside a chat message with full syntax highlighting
- **Emoji Reactions** — React to any message with 👍 ❤️ 😂 😮 😢 👏
- **Reply Threads** — Quote and reply to any specific message
- **Typing Indicators** — See live "User is typing…" dots in real-time
- **Realtime Delivery** — Messages arrive instantly via Supabase Realtime channels

### 👤 User Profiles & Avatars
- **Custom Display Name & Username** — Set how your name appears to others in Settings
- **Avatar Upload** — Upload a custom profile picture (JPG, PNG, WEBP, max 2MB)
- **Auto Cleanup** — Old avatar is automatically deleted from storage on upload to save space
- **Avatars in Chat** — Profile pictures appear next to every message in chat rooms
- **Sidebar Avatar** — Your avatar shows in the bottom-left of the sidebar on desktop

### 🔔 Notifications
- **In-App Bell** — Bell icon in the header with a live red dot when new alerts arrive
- **Realtime Push** — Notifications delivered instantly via Supabase Realtime (no page refresh needed)
- **Native Desktop Alerts** — Browser permission prompt on login; approved users get Windows/Mac system pop-ups for new notifications
- **Notification Types** — Supports `announcement`, `reply`, `mention`, and `moderation` categories
- **Mark as Read** — Click any notification in the dropdown to dismiss it

### 🛡️ Admin Mode
- **See all students' sessions** across the entire platform
- **Student Activity Directory** — Table with Java/MongoDB/Total counts per student
- **Click-to-filter** — Click any student row to filter sessions by that student
- **Email badges** — Every session card shows the owner's email when in admin mode
- **Avatar Moderation** — View every user's avatar thumbnail in the admin table; remove any avatar that breaks rules with a single click (requires confirmation to prevent accidents)
- **Audit Log** — Every admin moderation action (avatar deletion) is automatically logged to `audit_logs` for accountability
- **Global Announcements** — Send an instant broadcast notification to every registered student's notification bell from the admin dashboard

### 🎨 Themes & Design
- **Theme Engine** — Switch between 4 beautiful built-in themes from the Settings page:
  - 🟡 **Original Gold** — Classic dark with warm gold accent
  - 🔵 **Ocean Blue** — Deep navy with electric blue
  - 🟢 **Emerald Hack** — Terminal-green hacker aesthetic
  - ⚪ **Pearl Light** — Clean light mode with violet accent
- **Premium dark theme** — Gold (`#c8ab7e`) accent on near-black terminal background
- **Glassmorphism** on Login card
- **Micro-animations** — Hover states, fadeIn, scale transforms
- **Responsive** — Desktop sidebar + mobile bottom navigation (Home, Chat, Search, Settings)
- **Custom scrollbar** — Gold-tinted on hover

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 19 + Vite 8 |
| Routing | React Router v7 (HashRouter for GitHub Pages) |
| Styling | Tailwind CSS v4 + Custom Design Tokens |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Backend / Database | Supabase (PostgreSQL + Auth + RLS + Realtime) |
| Storage | Supabase Storage (Avatar images bucket) |
| Date Formatting | `date-fns` |
| Icons | `lucide-react` |
| Deployment | GitHub Pages (static) |

---

## 🗄️ Database Schema

```sql
-- sessions table
CREATE TABLE sessions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id),
  user_email  TEXT,
  title       TEXT,
  subject     TEXT,           -- 'Java' | 'MongoDB'
  topic       TEXT,
  aim         TEXT,
  code        TEXT,
  output      TEXT,
  notes       TEXT,
  tags        TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  is_shared   BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  share_id    UUID DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- profiles table
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT,
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- notifications table
CREATE TABLE notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,   -- 'announcement' | 'reply' | 'mention' | 'moderation'
  message    TEXT NOT NULL,
  link       TEXT,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- audit_logs table (admin moderation history)
CREATE TABLE audit_logs (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action         TEXT NOT NULL,
  target_user_id UUID,
  details        TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security enabled on all tables
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone & Install
```bash
git clone https://github.com/GajjarKashyap/CodeValut.git
cd CodeValut
npm install
```

### 2. Configure Environment
Create `.env.local` in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database
Run all the SQL from the **Database Schema** section above in your Supabase SQL editor. Also create an `avatars` storage bucket in Supabase Storage (set to **Public**).

### 4. Create Admin Account
Create a user in Supabase Auth with the email `admin@admin.com` to get admin privileges.

### 5. Run Locally
```bash
npm run dev
```

### 6. Deploy to GitHub Pages
```bash
npm run deploy
```

---

## 📁 Project Structure

```
src/
├── components/
│   └── Layout.jsx          # Sidebar + topbar + mobile nav + notifications + avatar
├── contexts/
│   └── AuthContext.jsx     # Supabase auth state
├── lib/
│   └── supabase.js         # Supabase client
├── pages/
│   ├── Login.jsx           # Terminal-themed login
│   ├── Dashboard.jsx       # Stats + admin directory + announcement tool
│   ├── SessionForm.jsx     # Create/edit sessions with Monaco editor
│   ├── SessionList.jsx     # Java / MongoDB / Favorites filtered lists
│   ├── Search.jsx          # Real-time search with filter chips
│   ├── Share.jsx           # Public share view (no auth required)
│   ├── Archive.jsx         # Archived sessions with restore/delete
│   ├── ChatDashboard.jsx   # Chat list — DMs, groups, global rooms
│   ├── ChatRoom.jsx        # Real-time chat with reactions, replies, snippets
│   └── Settings.jsx        # Theme engine + user profile + avatar upload
└── index.css               # Global styles, animations, scrollbar, theme tokens
```

---

## 🗺️ Roadmap

- [x] Real-time Group Chat & Direct Messages
- [x] Code Snippet sharing in Chat
- [x] Emoji Reactions & Reply Threads
- [x] User Profiles & Custom Avatars
- [x] Realtime Notification Center with Native Desktop Alerts
- [x] Admin Avatar Moderation with Audit Log
- [x] Global Announcement Broadcast Tool
- [x] Theme Engine (Gold / Blue / Emerald / Pearl)
- [ ] PDF export of sessions
- [ ] Session statistics / progress charts
- [ ] Rich text notes (Markdown preview)
- [ ] Batch export (ZIP of all sessions as TXT)
- [ ] Teacher comments on shared sessions
- [ ] Offline PWA support

---

## 👨‍💻 Developer

<div align="center">

**Kashyap Gajjar**

*Sole developer and designer of CodeVault*

[![GitHub](https://img.shields.io/badge/GitHub-GajjarKashyap-181717?style=flat-square&logo=github)](https://github.com/GajjarKashyap)

</div>

---

<div align="center">

**⚡ In Beta Phase — Progress is safe but app changes every day.**

*Built with passion for students who deserve better than paper lab notebooks.*

</div>
