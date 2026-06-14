# 🚀 TaskFlow Pro

**TaskFlow Pro** is a minimalist, high-performance SaaS platform engineered for seamless technical project management and team synchronization. Built for teams that need to scale fast and collaborate in real-time, offering enterprise-grade performance and clarity.

**Architecture and Development by:** Bhavesh Baraiya

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, Shadcn UI, React Virtuoso
* **Backend:** Node.js (Next.js Server Actions), NextAuth.js (Credentials)
* **Database:** MongoDB (Atlas), Mongoose
* **Real-Time:** Pusher.js (WebSockets / Channels)
* **State & Caching:** TanStack Query (React Query)
* **Validation:** Zod (TypeScript Source of Truth)
* **Storage & Media:** UploadThing / AWS S3
* **Editor:** Tiptap (Rich Text Editor)

---

## ✨ Key Features

### 📋 Agile Project Management
* **Dynamic Kanban Engine:** Custom HTML5 drag-and-drop workflow for both vertical tasks and horizontal workflow columns.
* **Custom Stages:** Users can dynamically create, edit, rename, and delete workflow phases (e.g., "QA", "In Review") on the fly.
* **Detailed Task Inspector:** Comprehensive modal for editing task requirements, setting priority tiers, tracking start/due dates, and managing multi-user assignments.
* **Rich Text Editing:** Integrated Tiptap editor for block-based, fully formatted task descriptions and project documentation.

### 💬 Real-Time Collaboration
* **Unified Communications Hub:** Dedicated inbox supporting Project-Wide Group Channels and 1-on-1 Direct Messaging.
* **Live WebSockets:** Bi-directional, real-time message delivery powered by Pusher.js.
* **Smart Mentions & Alerts:** Live teammate search using `@` notation, backed by OS-level browser push notifications and in-app toasts.
* **File Attachments:** Upload images, PDFs, and documents directly into chat streams and tasks.

### 🗂️ Dynamic Workspace Architecture
* **Custom Draggable Tabs:** Navigate between Kanban boards, Access Credentials, and Project Notes using a native, horizontally draggable tab system.
* **Auto-Saving Documents:** Background debounced syncing ensures project notes and credentials are never lost.
* **Workspace Gatekeeper:** Strict middleware and database querying ensures perfectly isolated, multi-tenant data access.

### 👥 Team & User Control
* **Frictionless Invites:** Project owners can easily invite registered colleagues via email to specific workspaces.
* **Profile Customization:** Upload custom avatars (under 2MB), set job titles, and manage personal notification preferences.
* **Account Security:** Secure email-change flow utilizing OTP (One-Time Password) verification and strict Zod schema validation to protect against malformed data.

---

## 🏗️ Project Architecture

This repository is optimized for the Next.js App Router and strict separation of concerns.

```text
taskflow-pro/
├── src/
│   ├── actions/       # Server-side mutations (chat.ts, project.ts, task.ts, user.ts)
│   ├── app/           # Application Routes (Layouts, Dashboard, Inbox, Projects)
│   ├── auth.ts        # NextAuth session configuration
│   ├── components/
│   │   ├── layout/    # Structural UI (MobileHeader.tsx, SidebarNav.tsx)
│   │   ├── shared/    # Reusable complex UI (ProjectChat, UserSettings, KanbanBoard)
│   │   └── ui/        # Shadcn UI primitives (Buttons, Inputs, Modals)
│   ├── lib/           # Core configs (db.ts, pusher-client.ts, validations)
│   ├── models/        # Mongoose Schemas (User, Project, Task, Message, Conversation)
│   └── utils/         # Helpers and UploadThing configurations
├── globals.css        # Global styles and Tailwind configurations
└── tailwind.config.ts # UI design tokens