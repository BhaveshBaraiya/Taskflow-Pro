This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

<!-- Next Js Auth Vs ReactJs Auth -->


# 🚀 TaskFlow Pro: Master Development Roadmap
**Lead Developer:** Bhavesh Baraiya
**Stack:** Next.js, React, MongoDB, Tailwind CSS, Shadcn UI

---

## ✅ PHASE 1: Core Kanban Engine (Completed)
**Status:** 100% Deployed
- [x] **Database Architecture:** Built `Project` and `Task` MongoDB schemas.
- [x] **Dynamic Columns:** Users can create custom workflow phases (e.g., "QA", "In Review") on the fly.
- [x] **Dual Drag-and-Drop:** Engineered custom HTML5 drag-and-drop for both horizontal columns and vertical tasks.
- [x] **Optimistic UI:** Wired local React state to update instantly without waiting for server network requests.
- [x] **Detailed Task View:** Upgraded standard task cards to open a massive, detailed modal for editing.

## ✅ PHASE 2: Team Collaboration (Completed)
**Status:** 100% Deployed
- [x] **Relational Databases:** Updated schemas to support multi-user environments via Mongoose object population.
- [x] **Workspace Invitations:** Built `ManageTeamModal` to allow project owners to invite registered users by email.
- [x] **Task Assignment:** Engineered a multi-select assignee list in the task creation flow.
- [x] **Avatar UI:** Integrated overlapping, styled circular Avatars on task cards to show responsibility at a glance.

## ✅ PHASE 3: Dynamic Workspace Hub (Completed)
**Status:** 100% Deployed
- [x] **Custom Native Tabs:** Replaced restrictive third-party libraries with a fully custom, native React tab bar.
- [x] **Draggable Layout:** Tabs can be dragged horizontally to reorganize the workspace hierarchy.
- [x] **Dynamic Tab Generation:** Users can spawn unlimited custom document views directly into the workspace.
- [x] **In-Line Editing:** Tabs possess dedicated, editable titles and descriptions.
- [x] **Document Auto-Saving:** Built automatic database-syncing for custom textareas.

---

## ⏳ PHASE 4: Security, Validation & Auth Polish (Next)
**Status:** Up Next
- [ ] **Advanced Form Validation:** Implement `Zod` schema validation to strictly protect database inputs (Tasks, Projects, Invites) from malicious or malformed data.
- [ ] **Email Verification Engine:** Integrate `Nodemailer` or `Resend` to require users to verify their email addresses via secure tokens before accessing the dashboard.
- [ ] **Auth Polish:** Upgrade the Login and Registration screens with a sleek, minimalist design that matches the workspace aesthetic.
- [ ] **Global Dashboard:** Build the main `/dashboard` page to display all active projects as premium summary cards instead of routing straight to a single project.

---

## 🔮 PHASE 5: Real-Time Communication (Remaining)
**Status:** Pending Architecture
- [ ] **WebSocket Integration:** Set up `Socket.io` or `Pusher` to handle real-time, bi-directional data flow without page refreshes.
- [ ] **Project-Wise Group Chats:** Build a dedicated chat hub inside the workspace tabs where all project members can discuss overall strategy.
- [ ] **Ticket/Task Threads:** Allow members to comment and chat directly inside a specific Task Modal for granular updates.
- [ ] **Direct Messaging (User-to-User):** Implement private 1-on-1 chats between team members.
- [ ] **Real-Time Notifications:** Push instant UI toasts and update a global Notification Bell when a user is assigned a task or mentioned in a chat.

## 🔮 PHASE 6: Rich Content & Final Polish (Remaining)
**Status:** Pending Architecture
- [ ] **Actual Rich Text Editor (RTE):** Swap out the fake textareas for a real markdown library (like `TipTap` or `React Quill`) so bold/italic/list formatting works globally.
- [ ] **File Attachments:** Allow users to upload images and PDFs to Tasks and Documents using AWS S3 or UploadThing.
- [ ] **Dark Mode:** Implement a global theme toggle for late-night coding and project management.


<!-- Last -->

# 🚀 TaskFlow Pro - Development Roadmap

TaskFlow Pro is a minimalist, high-performance SaaS platform engineered for seamless technical project management and team synchronization.

## 🏗️ Core Architecture
- **Framework:** Next.js 15 (App Router)
- **Database:** MongoDB & Mongoose
- **Real-time:** Pusher.js (WebSockets)
- **Validation:** Zod (Global Schema Enforcement)
- **UI:** Tailwind CSS + Shadcn UI

---

## 🗺️ Development Phases

### ✅ PHASE 1: Kanban & Project Engine
- [x] Dynamic Kanban columns and task drag-and-drop.
- [x] Optimistic UI implementation for instant task updates.
- [x] Dynamic Workspace Tab system (Kanban, Docs, Chat).

### ✅ PHASE 2: Auth & Security
- [x] Secure authentication with NextAuth (Credentials).
- [x] Zod-enforced input validation for Auth and Data.
- [x] Production-grade field-level error handling.

### ✅ PHASE 3: Real-Time Communication
- [x] Unified Inbox (Project Channels & Direct Messages).
- [x] WebSocket integration (Pusher) for live message delivery.
- [x] User-to-user DM and Group Chat creation.

### ⏳ PHASE 4: File & Media (Next Up)
- [ ] Integration of UploadThing/S3 for cloud file storage.
- [ ] Persistent file attachments for chat and task documents.
- [ ] Rich Text Editor (RTE) implementation for project notes.

### 🔮 PHASE 5: Advanced Features
- [ ] Global Notification Engine (Mentions & Task Assignments).
- [ ] Dark Mode support across all components.
- [ ] Role-based access control (Admin/Member/Guest).

---

## 🛠️ Tech Stack Explained
| Component | Technology |
| :--- | :--- |
| **Frontend** | React 19, Tailwind, Shadcn |
| **Backend** | Node.js (Server Actions), Next.js |
| **Database** | MongoDB (Atlas) |
| **Real-time** | Pusher Channels |
| **Validation** | Zod (Typescript Source of Truth) |

---

## 🚀 Current Status
**Status:** Beta (Architecture Locked). 
*Current focus is transitioning from local file-handling to robust cloud storage solutions for attachments.*

---
*Architecture and Development by Bhavesh Baraiya*



<!--  -->

This is your Final Master Roadmap for TaskFlow Pro. This document outlines every phase, functionality, and folder structure. You can use this as your permanent reference for the project architecture.I. The Project Architecture (Folder Structure)This structure is optimized for Next.js 16/App Router and separation of concerns.Plaintexttaskflow-pro/
├── src/
│   ├── actions/          # All server-side logic (chat.ts, project.ts, task.ts, user.ts)
│   ├── app/              # Application Routes (Layouts, Dashboard, Inbox, Projects)
│   ├── auth.ts           # NextAuth session configuration
│   ├── components/
│   │   ├── layout/       # MobileHeader.tsx, SidebarNav.tsx
│   │   ├── shared/       # Reusable components (ProjectChat.tsx, ProjectDocs.tsx, UserSettings.tsx, KanbanBoard.tsx)
│   │   └── ui/           # Shadcn UI primitives
│   ├── lib/              # Database connection (db.ts), Pusher config (pusher-client/server.ts)
│   ├── models/           # Mongoose Data Models (User, Project, Task, Message, Conversation)
│   └── utils/            # UploadThing config, Helpers (formatters)
├── globals.css           # Global styles and Tailwind v4 configurations
└── tailwind.config.ts    # (If using v3, otherwise styles are in globals.css)
II. Project Phases & Functionality RoadmapPhaseFocusStatusPhase 1: CoreAuth, Workspace DB, Multi-tenancy100%Phase 2: MessagingReal-time Chat (Pusher), Attachments, Mentions, Notifications100%Phase 3: ProductivityKanban Board, Drag/Drop, Task CRUD, Phase Management100%Phase 4: User LayerProfile Edit, Avatar Upload, Email/OTP Auth, Settings100%Phase 5: DocsRich Text Editor (TipTap), Auto-save, Project TabsIn ProgressIII. Detailed Functionality ChecklistPhase 1: Foundation (Completed)NextAuth Integration: Secure session handling.MongoDB Gatekeeper: Middleware ensures every user belongs to an active workspace.Multi-tenancy: Isolated data access for workspaces.Phase 2: Messaging (Completed)Pusher Real-time: Immediate message delivery across clients.Global Alerts: OS-level browser notifications + In-app toasts.Mention Engine: Live search for teammates using @ notation.File Storage: UploadThing integration for images and documents.Phase 3: Productivity (Completed)Kanban Engine: Modern drag-and-drop workflow.Dynamic Columns: Create/Delete workflow phases dynamically.RTE Task Details: Rich text descriptions for task requirements.Phase 4: User Layer (Completed)Profile Management: Edit name, job title, and avatar (PC upload).Account Security: Email change flow via OTP verification.Notification Controls: Toggle preferences for Browser/In-app alerts.Danger Zone: Account deletion and secure logout.Phase 5: Documentation (Next/Final)Editor: TipTap block-based writing environment.Auto-save: Debounced background saves to MongoDB.Project Tabs: Switcher UI for Board vs. Docs within the project view.IV. Current Status: Completion AssessmentOverall Completion: 95%You have built a production-ready SaaS infrastructure. The only remaining "operational" functionality is finalizing the Project Docs integration. Once the Docs tab is merged into the project view, the system is feature-complete.V. How to maintain thisAlways use Server Actions (src/actions/): Do not write business logic inside UI components. This keeps your client components clean and your server-side logic predictable.Population Consistency: Whenever you add a new field (like avatarUrl) to a model, you must update the .populate() calls in your server actions (like getMessages and getInboxData) to ensure the client receives the data.Responsive First: Every new component you build must follow the md:flex (desktop) vs. flex flex-col (mobile) pattern used in your InboxPage.