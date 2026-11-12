# Submission Manifest — Ajaia Docs

**Candidate:** Sadat Shahriar Arko  
**Project:** Ajaia Docs — Collaborative Document Studio  
**Live Deployment:** https://ajaia-assessment-3p9vlzrdc-team-ghost2.vercel.app/
**Source Repository:** https://github.com/Shahriar-Arko/AJAIA_Assessment.git 

---

## Included Deliverables

1. **Full-Stack Application Source Code (`app/`, `components/`, `lib/`):**
   - **Authentication (`app/api/auth/*`, `lib/auth.ts`):** User registration, login, logout, and `httpOnly` cookie session verification.
   - **Document Management & Collaboration (`app/api/documents/*`):** CRUD APIs, `.docx`/`.md`/`.txt` import and in-editor appending (`mammoth`), and granular **Owner / Editor / Viewer** sharing (`app/api/documents/[id]/share/route.ts`).
   - **Studio UI & Rich-Text Editor (`app/page.tsx`, `app/docs/[id]/page.tsx`, `components/RichTextEditor.tsx`):** Obsidian Glass dashboard with `Ctrl+K` live search, starter templates, drag-and-drop file upload, Tiptap rich-text editor, `1.5s` real-time multi-tab synchronization, and 1-click A4 PDF export (`jsPDF`).
2. **Automated Test Suite (`__tests__/ajaia-docs.test.ts`, `vitest.config.mts`):**
   - Unit tests validating SHA-256 password hashing/verification, Owner/Editor/Viewer permission guards, and collaborator role normalization (`npx vitest run`).
3. **Setup & Run Documentation (`README.md`):**
   - Complete local setup instructions, environment variable configuration, test commands, and architecture overview.
4. **Architecture Note (`ARCHITECTURE.pdf`):**
   - Concise technical breakdown covering Next.js 16 serverless topology, MongoDB Atlas schemas, RBAC enforcement, real-time sync conflict avoidance, and client-side PDF generation.
5. **AI Engineering Workflow Note (`AI_WORKFLOW.pdf`):**
   - Summary of phased AI-assisted development, human-in-the-loop debugging (Next.js 16 Turbopack/TypeScript strictness, Tailwind v4 PDF rendering), and automated test verification.
6. **Submission Manifest (`SUBMISSION.md`):**
   - This inventory listing all deliverables, live links, and repository artifacts.

---

## Verification Checklist

- [x] `npx vitest run` — All unit tests pass.
- [x] `npm run build` — Production build compiles cleanly with zero TypeScript errors.
- [x] Live Vercel deployment verified with MongoDB Atlas persistence, multi-user RBAC sharing, file import/append, and PDF export.