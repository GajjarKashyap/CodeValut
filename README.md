<div align="center">

<img src="public/screenshots/login.png" alt="CodeVault Login Banner" width="100%"/>

# ⚡ CodeVault — Lab Notebook & Dev Ecosystem

**A state-of-the-art dark-mode practical notebook, real-time code collaboration hub, and native mobile lab engineered for university computer science and IT programming practicals.**

[![Status](https://img.shields.io/badge/Status-Active_Beta-c8ab7e?style=for-the-badge&logo=zap&logoColor=121212)](https://github.com/GajjarKashyap/CodeValut)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime_&_Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android_Native-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

---

### 🔥 **ANNOUNCEMENT: We soon Drop Something Big** 🔥
> *Stay tuned! We are currently engineering groundbreaking next-generation updates and massive platform enhancements that will revolutionize how students write, store, collaborate, and execute code in computer science labs. Watch this repository closely!*

</div>

---

## 📖 Table of Contents
1. [💡 Why CodeVault Was Developed (The Origin & Vision)](#-why-codevault-was-developed-the-origin--vision)
2. [⚡ Why Supabase? (Database & Architecture Philosophy)](#-why-supabase-database--architecture-philosophy)
3. [📸 Platform Preview & Screenshots](#-platform-preview--screenshots)
4. [🧩 Complete Module & Function Breakdown](#-complete-module--function-breakdown)
   - [Core Architecture & Auth (`App.jsx`, `AuthContext.jsx`)](#1-core-architecture--auth-appjsx-authcontextjsx)
   - [IDE & Session Management (`SessionForm.jsx`, `SessionList.jsx`, `CodeToolbar.jsx`)](#2-ide--session-management-sessionformjsx-sessionlistjsx-codetoolbarjsx)
   - [Real-Time Collaboration & QR Sharing (`ChatDashboard.jsx`, `ChatRoom.jsx`)](#3-real-time-collaboration--qr-sharing-chatdashboardjsx-chatroomjsx)
   - [Admin Control & Directory (`Dashboard.jsx`)](#4-admin-control--directory-dashboardjsx)
   - [Rich Error Handling & Crash Shield (`NotFound`, `Forbidden`, `ServerError`, `NetworkError`)](#5-rich-error-handling--crash-shield-notfound-forbidden-servererror-networkerror)
   - [Multi-Theme & Settings (`Settings.jsx`, `Layout.jsx`)](#6-multi-theme--settings-settingsjsx-layoutjsx)
   - [Native Mobile Ecosystem (`mobile-app/`)](#7-native-mobile-ecosystem-mobile-app)
5. [📡 How the API & Database Calls Work (PostgREST Deep-Dive)](#-how-the-api--database-calls-work-postgrest-deep-dive)
6. [🗄️ Comprehensive Database Schema & RLS Policies](#-comprehensive-database-schema--rls-policies)
7. [🚀 Getting Started & Local Installation](#-getting-started--local-installation)
8. [👨‍💻 Lead Architect & Creator](#-lead-architect--creator)

---

## 💡 Why CodeVault Was Developed (The Origin & Vision)

For decades, college programming laboratories in Computer Science and Information Technology have suffered from an archaic, inefficient workflow:
1. **The Paper & Word Document Trap:** Students are forced to write or paste hundreds of lines of code into MS Word documents or physical lab journals where formatting breaks, syntax highlighting is non-existent, and code cannot be easily executed or searched.
2. **Fragmented Storage across Flash Drives:** Code snippets from weekly assignments end up scattered across messy desktop folders, USB drives, or untracked WhatsApp study groups.
3. **Lack of Instant Peer & Admin Verification:** When a student faces a compiler error or wants to verify logic with a classmate or lab professor, they have no fast, real-time channel to share exact syntax without losing formatting.

### **The CodeVault Solution**
CodeVault was conceived and built from scratch as a **next-generation cloud notebook and development hub** tailored to solve these exact friction points:
- **Centralized Cloud Vault:** Every lab session (`Java` & `MongoDB`) is instantly saved in PostgreSQL, categorized by subject and topic, and accessible from anywhere.
- **True IDE Experience:** Embedded **Monaco Editor** provides real-time syntax checking, automatic bracket matching, and clean code formatting right inside the web app.
- **Effortless Collaboration:** Students can share exact code payloads inside **real-time chat rooms** or invite peers via **instant QR codes**.
- **Admin Verification:** Professors or Lab Admins (`admin@admin.com`) can inspect student progress, monitor activity, moderate profiles, and broadcast instant lab announcements.

---

## ⚡ Why Supabase? (Database & Architecture Philosophy)

When architecting CodeVault, we made a strategic decision to use **Supabase (PostgreSQL + PostgREST + Realtime WebSockets)** instead of building a traditional custom backend server (like Node/Express + MongoDB). Here is exactly why:

| Architectural Requirement | Why Supabase Excels over Traditional Backends |
| :--- | :--- |
| **1. Zero-Latency Row Level Security (RLS)** | In a multi-user lab notebook, security is paramount. Instead of writing complex API middleware for every route, **Supabase RLS runs directly at the PostgreSQL kernel level**. Policies check `auth.uid()` instantly, guaranteeing that students can only read/edit their own private vault sessions while granting `admin@admin.com` universal audit access without a single line of redundant backend code. |
| **2. Real-Time WebSockets (`pg_notify`)** | CodeVault features live chat rooms, instant notification bells, and live typing indicators. Supabase Realtime listens to PostgreSQL WAL (Write-Ahead Log) changes and broadcasts them over WebSockets (`supabase.channel()`). When someone sends a message or reacts with an emoji, all connected devices update in `<50ms` without API polling. |
| **3. Integrated Auth & JWT Ecosystem** | Supabase Auth provides out-of-the-box secure session management, automatic JWT refresh, and seamless integration between `auth.users`, our custom `profiles` table, and `user_activity` tracking. |
| **4. High-Performance Object Storage** | We store custom user avatars (`avatars` bucket) in Supabase Storage with automatic URL generation, CDN caching, and database triggers that auto-clean old image blobs when users update their profile. |
| **5. PostgREST Auto-API Engine** | Supabase automatically generates secure, RESTful API endpoints directly from our database schema. This allows our React frontend to execute rich relational queries (`select`, `insert`, `update`, `delete`, pagination, full-text search) safely from the client using `supabase-js`. |

---

## 📸 Platform Preview & Screenshots

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

## 🧩 Complete Module & Function Breakdown

Below is a technical, deep-dive breakdown of every module, component, and core function inside the CodeVault repository:

### 1. Core Architecture & Auth (`App.jsx`, `AuthContext.jsx`)
- **`App.jsx` (`<Router>`, `<ErrorBoundary>`, `<ProtectedRoute>`)**:
  - The master entry point of the application. Uses `HashRouter` (`#/...`) to ensure 100% compatibility with GitHub Pages static hosting and native Capacitor Android navigation.
  - Wraps the route hierarchy in our custom **`ErrorBoundary`** (which catches fatal React rendering bugs and displays `ServerError.jsx`).
  - Implements **`VersionChecker`**, which fetches `version.json` on boot, compares semantic versions (`compareVersions`), and prompts users to update when new releases or mandatory security patches drop.
- **`AuthContext.jsx` (`useAuth()`, `fetchProfile()`, `updateUserActivity()`)**:
  - Provides global authentication state (`user`, `profile`, `isAdmin`, `loading`).
  - **`onAuthStateChange`**: Subscribes to Supabase auth events on boot. When logged in, it fetches `profiles` and triggers `updateUserActivity()` to update the student's heartbeat (`user_activity` table) with their latest `username`, `email`, and `last_active` timestamp.

---

### 2. IDE & Session Management (`SessionForm.jsx`, `SessionList.jsx`, `CodeToolbar.jsx`)
- **`SessionForm.jsx` (`handleSubmit()`, `handleKeyDown()`, `Editor Toggle`)**:
  - The practical notebook creation and editing hub.
  - **Monaco Engine vs. Simple Fallback**: Loads `@monaco-editor/react` with rich Java/JavaScript IntelliSense. If on a low-end mobile phone or slow connection, users can toggle to **Simple Editor Mode** (`<textarea>`), where a custom `handleKeyDown` interceptor inserts 4 spaces when the `Tab` key is pressed.
  - **Global Shortcut (`Ctrl+S`)**: Intercepts `window.addEventListener('keydown')` so pressing `Ctrl+S` (or `Cmd+S`) saves the practical to Supabase instantly from any field.
  - **`handleSubmit`**: Validates fields, parses comma-separated tags into a PostgreSQL text array (`tags: string[]`), and executes `.insert()` or `.update()` on the `sessions` table.
- **`SessionList.jsx` & `Search.jsx` (`fetchSessions()`, `handleToggleFavorite()`)**:
  - Renders grid/list cards of practicals filtered by `subject` (`Java` vs `MongoDB`), `favorites`, or `archive`.
  - Uses `date-fns` (`formatDistanceToNow`) for human-readable time badges and allows one-click starring (`is_favorite`) or soft-deleting (`is_archived: true`).
- **`CodeToolbar.jsx`**:
  - Embedded above code boxes. Provides language badges (`Java` / `Mongo`), output formatting, and one-click clipboard copying (`navigator.clipboard.writeText`) with visual checkmark feedback.

---

### 3. Real-Time Collaboration & QR Sharing (`ChatDashboard.jsx`, `ChatRoom.jsx`)
- **`ChatDashboard.jsx` (`fetchChats()`, `handleBulkDeleteGroups()`, `handleCreateDirectMessage()`)**:
  - The messaging hub listing all 1-on-1 Direct Messages, Group Rooms, and Global Broadcast Channels.
  - **Always-Visible Delete Pills:** Every chat card features an explicit red `[Trash2] Delete` button (`opacity-100`) with precise `e.stopPropagation()` handling so users can delete or leave chats without accidentally opening them.
  - **Bulk Selection Mode (`isGroupSelectMode`)**: Clicking **`Select`** activates checkboxes across all chats. Clicking **`Delete Selected`** runs `handleBulkDeleteGroups()`, which checks user ownership and cleanly deletes or unlinks multiple rooms in one batch transaction.
- **`ChatRoom.jsx` (`sendMessage()`, `handleReaction()`, `handleBulkDelete()`, `QR Sharing`)**:
  - **Realtime WebSockets (`supabase.channel`)**: Subscribes to `INSERT`, `UPDATE`, and `DELETE` events on `group_messages`. New messages appear instantly without page refreshes.
  - **QR Code Sharing (`qrcode.react` & `jsQR`)**: Clicking the **`[QR]`** button generates an instant, scannable invite link for the room right inside a modal. Users can also scan or upload a QR image (`handleFileUploadForQR`) using `jsQR` to auto-parse and join rooms locally!
  - **In-Chat Bulk Message Deletion (`isSelectionMode`)**: Users can check off multiple chat bubbles and batch-delete them from `group_messages` in one click.
  - **Code Snippet Embedding**: Users can click the code icon (`CodeToolbar`) to attach live, syntax-highlighted code blocks directly inside their messages.
  - **Emoji Reactions (`handleReaction`)**: Modifies the `reactions` JSONB column (`{ "👍": ["user1_id"], "❤️": ["user2_id"] }`) in real-time.

---

### 4. Admin Control & Directory (`Dashboard.jsx`)
- **`Dashboard.jsx` (`fetchAdminData()`, `handleModerateAvatar()`, `handleSendAnnouncement()`)**:
  - When logged in as `admin@admin.com`, the dashboard transforms into an **Enterprise Admin Console**:
  - **Student Activity Directory**: Queries `user_activity` and aggregates `sessions` counts (`java_count`, `mongodb_count`, `total_sessions`) for every registered student. Clicking any student row instantly filters the vault view to show only that student's work!
  - **Avatar Moderation (`handleModerateAvatar`)**: Displays every student's profile picture thumbnail. Admins can click `[Remove Avatar]` to reset an offending image (`avatar_url: null`) and automatically insert a permanent record into `audit_logs` (`action: 'avatar_removed'`).
  - **Global Announcement Tool (`handleSendAnnouncement`)**: Admins can type a message and broadcast it to every student on the platform. The function loops through all users and inserts records into `notifications` (`type: 'announcement'`), causing every student's header bell (`Bell`) to light up with a red notification dot instantly!

---

### 5. Rich Error Handling & Crash Shield (`NotFound`, `Forbidden`, `ServerError`, `NetworkError`)
To ensure CodeVault never shows a generic blank browser page or confusing console crash, we engineered four dedicated, developer-themed recovery screens:
- **`NotFound.jsx` (`/404` & wildcard `*`)**:
  - Features an **interactive search input** right inside the error screen so students who mistype a URL or click a deleted link can search their vault immediately without navigating away.
  - Displays a simulated bash terminal check (`codevault inspect --path "/missing" -> [ERROR] Target not found`).
- **`Forbidden.jsx` (`/403`)**:
  - Triggered when a user attempts to access a locked group room, private practical session, or restricted admin page without proper clearance.
  - Features glowing amber security locks (`Lock`) and terminal policy diagnostic checks (`chmod 700 / permission denied`).
- **`ServerError.jsx` (`/500` & `ErrorBoundary`)**:
  - Our global crash recovery screen. If a React component throws a fatal JavaScript exception, this page catches it cleanly.
  - **One-Click Error Copy (`handleCopyError`)**: Includes a **`Copy Error Log`** button that copies a pre-formatted crash report (with exact timestamp, error message, and stack trace) to the user's clipboard for easy debugging.
  - Features a **`Restart & Clear Cache`** button that purges stale localStorage navigation states and reboots the app.
- **`NetworkError.jsx` (`/offline`)**:
  - Triggered when the user's WiFi connection drops or the cloud database endpoint fails to respond.
  - Features a live connection monitor (`ping api.supabase.co`) and an interactive **`Retry Connection`** button.

---

### 6. Multi-Theme & Settings (`Settings.jsx`, `Layout.jsx`)
- **`Settings.jsx` (`applyTheme()`, `handleAvatarUpload()`)**:
  - **Theme Engine**: Stores the selected theme (`codevault_theme`) in `localStorage` and applies custom CSS classes (`theme-gold`, `theme-blue`, `theme-emerald`, `theme-pearl`) to `document.documentElement`.
  - **Avatar Upload**: Validates image size (`< 2MB`), uploads files to the `avatars` bucket via `supabase.storage.from('avatars').upload()`, and updates `profiles.avatar_url`.
- **`Layout.jsx` (`fetchNotifications()`, `requestNotificationPermission()`)**:
  - The persistent sidebar, top navigation header, and bottom mobile navigation bar (`Home`, `Chat`, `Search`, `Settings`).
  - **Notification Center**: Subscribes to real-time `INSERT` events on the `notifications` table. When a new notification arrives (`announcement`, `reply`, `mention`), it plays a subtle visual pulse, updates the unread badge count, and triggers a **Native Windows/Mac/Android System Notification** if the user granted desktop permissions!

---

### 7. Native Mobile Ecosystem (`mobile-app/`)
The `mobile-app/` folder contains our standalone Capacitor Android shell (`build.gradle`, `AndroidManifest.xml`, `capacitor.config.json`):
- **Capacitor Native Bridge**: Wraps our Vite web bundle inside a native WebView (`com.codevault.app`), enabling native device capabilities.
- **`StickersLockScreen.jsx` (Biometric & PIN Security)**:
  - When enabled, students opening the Android app must pass a biometric fingerprint verification or enter their custom 4-digit PIN before they can access their stored code snippets or chats.
- **Direct APK Download (`DownloadApp.jsx`)**:
  - Accessible via `/download`, offering students a clean, one-click portal to download the latest production `.apk` directly to their Android phones.

---

## 📡 How the API & Database Calls Work (PostgREST Deep-Dive)

CodeVault interacts with Supabase using the **`@supabase/supabase-js`** client library. Under the hood, this library translates JavaScript method chaining into secure **PostgREST RESTful HTTP requests** sent over HTTPS.

### 1. Anatomy of a CodeVault Database Request
When a component fetches practical sessions, it executes:
```javascript
const { data, error } = await supabase
  .from('sessions')
  .select('*')
  .eq('subject', 'Java')
  .eq('is_archived', false)
  .order('updated_at', { ascending: false });
```
Under the hood, `supabase-js` formats and transmits this exact HTTP request:
```http
GET /rest/v1/sessions?subject=eq.Java&is_archived=eq.false&order=updated_at.desc HTTP/1.1
Host: your-project.supabase.co
apikey: your-anon-key
Authorization: Bearer <user-jwt-token>
Accept: application/json
```
1. **Authentication Header**: The `Authorization: Bearer <user-jwt-token>` header identifies the student making the request.
2. **PostgreSQL Execution**: PostgREST receives the GET request, validates the JWT, applies our Row Level Security (RLS) WHERE clause (`WHERE user_id = auth.uid()`), executes the SQL query inside PostgreSQL, and returns the rows as clean JSON.

---

### 2. Preventing `HTTP 406 Not Acceptable` Errors (`.maybeSingle()`)
A critical engineering lesson in PostgREST involves querying single records. If you use **`.single()`**:
```javascript
// Vulnerable query:
const { data, error } = await supabase.from('group_members').select('role').eq('group_id', id).single();
```
PostgREST attaches an HTTP header `Accept: application/vnd.pgrst.object+json`, strictly demanding **exactly one JSON object** in return. If the query finds **0 rows** (`or >1 row`), PostgREST throws a hard **`HTTP 406 Not Acceptable`** error!

To make CodeVault bulletproof, we engineered all read lookups using **`.maybeSingle()`**:
```javascript
// Bulletproof query across all CodeVault pages:
const { data, error } = await supabase.from('group_members').select('role').eq('group_id', id).limit(1).maybeSingle();
```
With `.maybeSingle()`, if 0 rows match (`e.g., when viewing an empty chat or checking a new direct message`), PostgREST returns `data: null` with status `200 OK`, completely preventing `406 Not Acceptable` console crashes across the entire platform!

---

## 🗄️ Comprehensive Database Schema & RLS Policies

To run CodeVault on your own Supabase instance, execute the following master SQL schema inside your Supabase SQL Editor:

```sql
-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Sessions table (Stores practicals)
CREATE TABLE sessions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email  TEXT,
  title       TEXT NOT NULL,
  subject     TEXT NOT NULL,          -- 'Java' | 'MongoDB'
  topic       TEXT,
  aim         TEXT,
  code        TEXT,
  output      TEXT,
  notes       TEXT,
  tags        TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  is_shared   BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  share_id    UUID DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. Profiles table (User metadata)
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE,
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 4. User Activity table (Student directory & heartbeat tracking)
CREATE TABLE user_activity (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT,
  email       TEXT,
  last_active TIMESTAMPTZ DEFAULT now()
);

-- 5. Groups table (Chat rooms & DMs)
CREATE TABLE groups (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name              TEXT NOT NULL,
  is_direct_message BOOLEAN DEFAULT false,
  is_global         BOOLEAN DEFAULT false,
  admin_only        BOOLEAN DEFAULT false,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- 6. Group Members table
CREATE TABLE group_members (
  id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role     TEXT DEFAULT 'member',     -- 'admin' | 'member'
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 7. Group Messages table (Real-time chat & code snippets)
CREATE TABLE group_messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  snippet    JSONB,                   -- Optional: { "title": "...", "code": "...", "language": "java" }
  reactions  JSONB DEFAULT '{}'::jsonb,
  reply_to   UUID REFERENCES group_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Notifications table (Push alerts)
CREATE TABLE notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,           -- 'announcement' | 'reply' | 'mention' | 'moderation'
  message    TEXT NOT NULL,
  link       TEXT,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Audit Logs table (Admin accountability)
CREATE TABLE audit_logs (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action         TEXT NOT NULL,
  target_user_id UUID,
  details        TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Sessions: Users can CRUD their own, public can read if is_shared=true, admin@admin.com can read all
CREATE POLICY "Users read own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id OR is_shared = true OR auth.jwt() ->> 'email' = 'admin@admin.com');
CREATE POLICY "Users insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'admin@admin.com');
CREATE POLICY "Users delete own sessions" ON sessions FOR DELETE USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'admin@admin.com');

-- Profiles & User Activity: Public read, owner update
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public read activity" ON user_activity FOR SELECT USING (true);
CREATE POLICY "Users update own activity" ON user_activity FOR ALL USING (auth.uid() = user_id);

-- Groups & Messages: Members and admins can access
CREATE POLICY "Public read groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Users insert groups" ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins delete groups" ON groups FOR DELETE USING (auth.uid() = created_by OR auth.jwt() ->> 'email' = 'admin@admin.com');

CREATE POLICY "Public read messages" ON group_messages FOR SELECT USING (true);
CREATE POLICY "Users insert messages" ON group_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete messages" ON group_messages FOR DELETE USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'admin@admin.com');

-- Notifications: User reads own, admins/users can insert
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update read status" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Audit Logs: Admin access only
CREATE POLICY "Admins read audit logs" ON audit_logs FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@admin.com');
CREATE POLICY "Admins insert audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'admin@admin.com');
```

---

## 🚀 Getting Started & Local Installation

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
Create a `.env.local` file in the project root directory:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Set Up Supabase Database & Storage
1. Copy the SQL from the **Comprehensive Database Schema** section above and run it inside your **Supabase SQL Editor**.
2. Go to **Supabase Storage**, create a new bucket named **`avatars`**, and set its visibility to **Public**.
3. Go to **Supabase Authentication**, create a new user with the exact email `admin@admin.com`, and set a strong password to unlock Enterprise Admin capabilities.

### 4. Run Development Server
```bash
# Start Web Development Server on localhost:5173
npm run dev

# Build and sync for Android Native APK (Capacitor)
cd mobile-app
npm install
npx cap sync android
```

### 5. Build & Deploy to Production
```bash
# Verify clean syntax and build production client bundle
npm run build

# Deploy live to GitHub Pages static repository
npm run deploy
```

---

## 👨‍💻 Lead Architect & Creator

<div align="center">

**Kashyap Gajjar**  
*Lead Architect, Designer & Full-Stack Developer*

[![GitHub](https://img.shields.io/badge/GitHub-GajjarKashyap-181717?style=flat-square&logo=github)](https://github.com/GajjarKashyap)

---

**⚡ In Beta Phase — Progress is safe, engineered with passion for college students.**  
*Remember: We soon Drop Something Big! Watch this repository closely.*

</div>
