"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import {
  FileText,
  Plus,
  Upload,
  LogOut,
  Users,
  Clock,
  Trash2,
  Loader2,
  FolderOpen,
  Sparkles,
  Eye,
  Edit3,
  Search,
  LayoutGrid,
  List as ListIcon,
  FileCode2,
  Briefcase,
  BookOpen,
  ArrowUpRight,
  ShieldCheck,
  Layers,
} from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

interface DocSummary {
  _id: string;
  title: string;
  content: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  sharedWith: { email: string; role: "editor" | "viewer" }[];
  userRole?: "editor" | "viewer";
  sourceFileName?: string | null;
  updatedAt: string;
}

const STARTER_TEMPLATES = [
  {
    id: "blank",
    label: "Blank Canvas",
    tag: "Rich Text",
    icon: Plus,
    accent: "from-indigo-500 to-violet-600",
    title: "Untitled Document",
    content: "<p></p>",
  },
  {
    id: "prd",
    label: "Product Spec / PRD",
    tag: "Engineering",
    icon: Layers,
    accent: "from-cyan-500 to-blue-600",
    title: "Product Requirements Spec",
    content:
      "<h1>Product Requirements Specification</h1><h2>1. Executive Summary</h2><p>Outline the core problem, target users, and measurable success metrics.</p><h2>2. Functional Requirements</h2><ul><li>Authentication &amp; Role-Based Access Control</li><li>Real-time cloud persistence &amp; document import</li></ul><h2>3. Milestones</h2><ol><li>Architecture &amp; Schema Design</li><li>API Implementation &amp; Testing</li></ol><p></p>",
  },
  {
    id: "meeting",
    label: "Executive Meeting Notes",
    tag: "Team Sync",
    icon: Briefcase,
    accent: "from-fuchsia-500 to-pink-600",
    title: "Weekly Sprint Sync",
    content:
      "<h1>Weekly Sprint Sync</h1><p><strong>Date:</strong> Today &nbsp;|&nbsp; <strong>Facilitator:</strong> Team Lead</p><h2>Key Decisions</h2><ul><li>Finalize Q4 roadmap deliverables</li><li>Review collaborator permissions</li></ul><h2>Action Items</h2><ol><li>Share draft spec with engineering reviewers</li></ol><p></p>",
  },
  {
    id: "research",
    label: "Technical Research Brief",
    tag: "Academic / R&D",
    icon: BookOpen,
    accent: "from-emerald-500 to-teal-600",
    title: "Technical Research Notes",
    content:
      "<h1>Technical Research Brief</h1><h2>Abstract</h2><p>Summarize methodology, experimental setup, and core findings.</p><h2>Key Observations</h2><ul><li>Latency and throughput benchmarks</li><li>Security &amp; privacy guarantees</li></ul><p></p>",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<UserInfo | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [ownedDocs, setOwnedDocs] = useState<DocSummary[]>([]);
  const [sharedDocs, setSharedDocs] = useState<DocSummary[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "owned" | "shared">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    checkSession();
  }, []);

  // Ctrl+K / Cmd+K shortcut to focus search bar
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function checkSession() {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return;
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text);
      if (data.user) {
        setUser(data.user);
        fetchDocuments();
      }
    } catch (err) {
      console.error("Session check failed:", err);
    } finally {
      setCheckingAuth(false);
    }
  }

  async function fetchDocuments() {
    setLoadingDocs(true);
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setOwnedDocs(data.owned || []);
        setSharedDocs(data.shared || []);
      }
    } finally {
      setLoadingDocs(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setOwnedDocs([]);
    setSharedDocs([]);
  }

  async function handleCreateFromTemplate(template: (typeof STARTER_TEMPLATES)[number]) {
    setCreatingId(template.id);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: template.title,
          content: template.content,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/docs/${data.document._id}`);
      }
    } finally {
      setCreatingId(null);
    }
  }

  async function uploadImportedFile(file: File) {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".docx") && !lower.endsWith(".md") && !lower.endsWith(".txt")) {
      alert("Please upload a valid .docx, .md, or .txt file.");
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/documents/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to import file.");
        return;
      }

      router.push(`/docs/${data.document._id}`);
    } catch {
      alert("Network error while importing file.");
    } finally {
      setImporting(false);
    }
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImportedFile(file);
    e.target.value = "";
  }

  async function handleDeleteDoc(e: React.MouseEvent, docId: string) {
    e.stopPropagation();
    if (!confirm("Delete this document permanently?")) return;

    const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
    if (res.ok) {
      setOwnedDocs((prev) => prev.filter((d) => d._id !== docId));
    }
  }

  function getPreviewText(html: string): string {
    const stripped = html
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return stripped ? stripped.slice(0, 130) : "Empty canvas — click to start writing...";
  }

  function getWordCount(html: string): number {
    const stripped = html
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return stripped ? stripped.split(/\s+/).length : 0;
  }

  const filteredOwned = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return ownedDocs;
    return ownedDocs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        getPreviewText(d.content).toLowerCase().includes(q)
    );
  }, [ownedDocs, searchQuery]);

  const filteredShared = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sharedDocs;
    return sharedDocs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.ownerName.toLowerCase().includes(q) ||
        getPreviewText(d.content).toLowerCase().includes(q)
    );
  }, [sharedDocs, searchQuery]);

  const totalCollaborators = useMemo(() => {
    const emails = new Set<string>();
    ownedDocs.forEach((d) => d.sharedWith?.forEach((c) => emails.add(c.email)));
    return emails.size;
  }, [ownedDocs]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060913]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthForm
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          fetchDocuments();
        }}
      />
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
          await uploadImportedFile(droppedFile);
        }
      }}
      className="min-h-screen bg-[#060913] bg-studio-grid text-slate-100 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white"
    >
      {/* Ambient Aurora Mesh Orbs */}
      <div className="fixed -top-40 left-1/4 w-[38rem] h-[38rem] rounded-full bg-indigo-600/15 blur-[130px] pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-[32rem] h-[32rem] rounded-full bg-fuchsia-600/12 blur-[130px] pointer-events-none" />
      <div className="fixed -bottom-40 left-10 w-[30rem] h-[30rem] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

      {/* Drag-and-Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-indigo-950/80 backdrop-blur-md border-2 border-dashed border-indigo-400 m-4 rounded-3xl flex flex-col items-center justify-center text-center pointer-events-none">
          <Upload className="w-14 h-14 text-indigo-300 animate-bounce mb-3" />
          <p className="text-xl font-extrabold text-white">Drop your .docx, .md, or .txt file</p>
          <p className="text-sm text-indigo-200 mt-1">
            We will convert it into an editable cloud document immediately
          </p>
        </div>
      )}

      {/* Top Glass Command Bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#060913]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-lg tracking-tight text-white">
                Ajaia Docs
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Cloud Synced
              </span>
            </div>
          </div>

          {/* Center Command Search */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative group">
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 absolute left-3.5 top-2.5 transition" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents, content, or owners..."
                className="w-full pl-10 pr-16 py-2 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-slate-900 border border-white/10 focus:border-indigo-500/60 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none transition"
              />
              <kbd className="absolute right-2.5 top-1.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white/5 border border-white/10 rounded-md">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Right User Pill & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 bg-white/[0.05] border border-white/10 pl-1.5 pr-3 py-1 rounded-full">
              <div
                className={`h-7 w-7 rounded-full ${user.avatarColor} text-white flex items-center justify-center text-xs font-bold shadow-inner`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Log out"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-rose-300 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-9">
        {/* Hero Command Center */}
        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900/90 via-indigo-950/70 to-slate-900/90 p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-tr from-indigo-500/30 to-fuchsia-500/25 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-400/25">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Welcome back, {user.name}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Collaborative Document Studio
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed">
                Launch a rich-text page from a curated template, drag-and-drop any{" "}
                <code className="px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 text-xs">.docx</code>,{" "}
                <code className="px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 text-xs">.md</code>, or{" "}
                <code className="px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 text-xs">.txt</code>{" "}
                file, and manage granular Editor &amp; Viewer access in real time.
              </p>

              {/* Quick Telemetry Pills */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-slate-300 flex items-center gap-2">
                  <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    <strong className="text-white">{ownedDocs.length}</strong> Owned Docs
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-slate-300 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    <strong className="text-white">{sharedDocs.length}</strong> Shared With Me
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>
                    <strong className="text-white">{totalCollaborators}</strong> Active Collaborators
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <button
                onClick={() => handleCreateFromTemplate(STARTER_TEMPLATES[0])}
                disabled={creatingId !== null}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:opacity-95 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/30 transition disabled:opacity-60 cursor-pointer"
              >
                {creatingId === "blank" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                New Blank Document
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.md,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/15 font-semibold text-sm rounded-2xl backdrop-blur-md transition disabled:opacity-60 cursor-pointer"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                ) : (
                  <Upload className="w-4 h-4 text-indigo-300" />
                )}
                Import .docx, .md or .txt
              </button>
            </div>
          </div>
        </section>

        {/* Quick-Start Template Gallery */}
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Start From a Template
            </h2>
            <span className="text-xs text-slate-500">1-click cloud document creation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STARTER_TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.id}
                  onClick={() => handleCreateFromTemplate(tpl)}
                  disabled={creatingId !== null}
                  className="group text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-400/50 rounded-2xl p-4 transition-all cursor-pointer flex items-center gap-3.5"
                >
                  <div
                    className={`h-11 w-11 rounded-xl bg-gradient-to-br ${tpl.accent} flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform`}
                  >
                    {creatingId === tpl.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition truncate">
                      {tpl.label}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{tpl.tag}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-300 transition shrink-0" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Filter Tabs & View Switcher Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 bg-white/[0.04] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Workspace ({filteredOwned.length + filteredShared.length})
            </button>
            <button
              onClick={() => setActiveTab("owned")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "owned"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              My Documents ({filteredOwned.length})
            </button>
            <button
              onClick={() => setActiveTab("shared")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === "shared"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Shared With Me ({filteredShared.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white/15 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List View"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-white/15 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loadingDocs ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
          </div>
        ) : (
          <div className="space-y-10">
            {/* Owned Documents Section */}
            {(activeTab === "all" || activeTab === "owned") && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-indigo-400" />
                    My Documents ({filteredOwned.length})
                  </h2>
                </div>

                {filteredOwned.length === 0 ? (
                  <div className="bg-white/[0.03] border border-dashed border-white/15 rounded-3xl p-12 text-center">
                    <FileText className="w-10 h-10 text-indigo-400/60 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-200">
                      {searchQuery ? "No matching documents found" : "No documents yet"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? "Try a different search keyword."
                        : "Pick a template above or drag & drop a .docx / .md / .txt file anywhere."}
                    </p>
                  </div>
                ) : (
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                        : "flex flex-col gap-3"
                    }
                  >
                    {filteredOwned.map((doc) => (
                      <div
                        key={doc._id}
                        onClick={() => router.push(`/docs/${doc._id}`)}
                        className="group relative bg-slate-900/75 hover:bg-slate-900 border border-white/10 hover:border-indigo-400/60 rounded-2xl p-5 shadow-lg hover:shadow-indigo-500/15 transition-all cursor-pointer flex flex-col justify-between backdrop-blur-md"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-8 w-8 rounded-lg bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center text-indigo-300 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <h3 className="font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
                                {doc.title}
                              </h3>
                            </div>

                            <button
                              onClick={(e) => handleDeleteDoc(e, doc._id)}
                              title="Delete document"
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/15 transition cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {doc.sourceFileName && (
                            <span className="inline-block mt-2.5 text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-400/25 px-2.5 py-0.5 rounded-full">
                              Imported: {doc.sourceFileName}
                            </span>
                          )}

                          <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                            {getPreviewText(doc.content)}
                          </p>
                        </div>

                        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {new Date(doc.updatedAt).toLocaleDateString()} •{" "}
                            {getWordCount(doc.content)}w
                          </span>

                          {doc.sharedWith.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-indigo-300 font-semibold bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-400/25">
                              <Users className="w-3 h-3" />
                              Shared ({doc.sharedWith.length})
                            </span>
                          ) : (
                            <span className="text-slate-500">Private</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Shared With Me Section */}
            {(activeTab === "all" || activeTab === "shared") && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Shared with Me ({filteredShared.length})
                  </h2>
                </div>

                {filteredShared.length === 0 ? (
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-7 text-center text-xs text-slate-400">
                    Documents shared with <strong className="text-slate-200">{user.email}</strong> will appear here automatically.
                  </div>
                ) : (
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                        : "flex flex-col gap-3"
                    }
                  >
                    {filteredShared.map((doc) => {
                      const isViewer = doc.userRole === "viewer";
                      return (
                        <div
                          key={doc._id}
                          onClick={() => router.push(`/docs/${doc._id}`)}
                          className="group bg-slate-900/75 hover:bg-slate-900 border border-emerald-500/25 hover:border-emerald-400/60 rounded-2xl p-5 shadow-lg hover:shadow-emerald-500/15 transition-all cursor-pointer flex flex-col justify-between backdrop-blur-md"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/25">
                                Owner: {doc.ownerName}
                              </span>

                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                  isViewer
                                    ? "bg-amber-500/15 text-amber-300 border border-amber-400/25"
                                    : "bg-indigo-500/15 text-indigo-300 border border-indigo-400/25"
                                }`}
                              >
                                {isViewer ? (
                                  <>
                                    <Eye className="w-3 h-3" /> Viewer
                                  </>
                                ) : (
                                  <>
                                    <Edit3 className="w-3 h-3" /> Editor
                                  </>
                                )}
                              </span>
                            </div>

                            <h3 className="font-bold text-white group-hover:text-emerald-300 transition mt-3 line-clamp-1">
                              {doc.title}
                            </h3>

                            <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                              {getPreviewText(doc.content)}
                            </p>
                          </div>

                          <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {new Date(doc.updatedAt).toLocaleDateString()}
                            </span>
                            <span
                              className={`font-semibold ${
                                isViewer ? "text-amber-300" : "text-emerald-300"
                              }`}
                            >
                              {isViewer ? "View Only →" : "Open Editor →"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}