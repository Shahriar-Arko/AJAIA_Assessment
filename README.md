# Ajaia Docs — Collaborative Document Studio

A full-stack collaborative document workspace built with **Next.js 16 (App Router)**, **TypeScript**, **MongoDB Atlas (Mongoose)**, **Tiptap**, **Mammoth**, and **jsPDF**. Ajaia Docs enables teams to draft rich-text documents, import or append `.docx`/`.md`/`.txt` files, collaborate in real time with granular **Owner / Editor / Viewer** permissions, and export formatted A4 PDFs directly to local storage.

- **Live Production URL:** `https://ajaia-assessment-iota.vercel.app`
- **Repository:** `https://github.com/Shahriar-Arko/AJAIA_Assessment`

---

## Core Features

- **Authentication & Session Security:**
  - SHA-256 password hashing with `httpOnly`, `SameSite=Lax` session cookies.
  - Explicit registration flow and instant session termination on logout.
- **Studio Workspace Dashboard:**
  - Instant `Ctrl+K` / `Cmd+K` live search across document titles, body text, and owners.
  - One-click starter templates (*Blank Canvas*, *Product Spec / PRD*, *Executive Meeting Notes*, *Technical Research Brief*), Grid/List view toggles, and drag-and-drop file ingestion.
- **Rich-Text Editor & Multi-Format Ingestion:**
  - Powered by **Tiptap (ProseMirror)** with headings (`H1–H3`), bold, italic, underline, ordered/unordered lists, undo/redo, and live word/character counters.
  - Upload `.docx` (parsed via `mammoth`), `.md`, or `.txt` files to create new cloud documents or append formatted content directly inside an open document.
- **Role-Based Access Control (RBAC):**
  - Invite collaborators by email as **Editor** or **Viewer**, dynamically update roles inside the **People with Access** modal, and enforce `403 Forbidden` guards on `PATCH` and `DELETE` endpoints.
- **Real-Time Multi-Tab Sync & 1-Click PDF Export:**
  - Non-blocking `1.5s` background polling paired with `500ms` debounced auto-save keeps collaborator tabs synchronized without interrupting active typing.
  - Client-side A4 PDF generation via `jsPDF` preserving document titles, headings, lists, and paragraph hierarchy.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| **Styling & Icons** | Tailwind CSS v4, Lucide React |
| **Editor & Parsers** | Tiptap (`@tiptap/react`, `@tiptap/starter-kit`), Mammoth (`.docx`), jsPDF |
| **Database & ODM** | MongoDB Atlas, Mongoose |
| **Testing** | Vitest |
| **Deployment** | Vercel |

---

## Local Setup & Run Instructions

### Prerequisites
- **Node.js** `v20+` and **npm**
- A **MongoDB Atlas** cluster (or local MongoDB instance)

### Step 1: Clone & Install Dependencies
```bash
git clone [https://github.com/Shahriar-Arko/AJAIA_Assessment.git](https://github.com/Shahriar-Arko/AJAIA_Assessment.git)
cd AJAIA_Assessment
npm install --legacy-peer-deps
```

### Step 2: Configure Environment Variables
Create a `.env.local` file in the project root (`F:\AJAIA\ajaia-docs\.env.local`):
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ajaia-docs?retryWrites=true&w=majority
```
*(Ensure `0.0.0.0/0` or your local IP address is whitelisted in MongoDB Atlas → Network Access.)*

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Run Automated Tests & Production Build
```bash
npx vitest run
npm run build
```