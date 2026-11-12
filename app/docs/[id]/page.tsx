"use client";

import { Suspense, useEffect, useState, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/RichTextEditor";
import {
  ArrowLeft,
  Check,
  Loader2,
  Save,
  Share2,
  Trash2,
  UserPlus,
  X,
  AlertCircle,
  FileText,
  Download,
  FileDown,
  FileCode,
  ChevronDown,
} from "lucide-react";

interface Collaborator {
  email: string;
  role: "editor" | "viewer";
}

interface DocumentData {
  _id: string;
  title: string;
  content: string;
  ownerName: string;
  ownerEmail: string;
  sharedWith: Collaborator[];
  isOwner: boolean;
  role: "owner" | "editor" | "viewer";
  canEdit: boolean;
  updatedAt: string;
}

function DocumentEditorContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved" | "forbidden">("saved");
  const saveStateRef = useRef<"saved" | "saving" | "unsaved" | "forbidden">(saveState);
  saveStateRef.current = saveState;

  const lastLocalEditRef = useRef<number>(0);

  const [importingFile, setImportingFile] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState<"editor" | "viewer">("editor");
  const [shareLoading, setShareLoading] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  // Close export dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadDoc() {
      try {
        const res = await fetch(`/api/documents/${id}`, { cache: "no-store" });
        if (res.status === 401) {
          router.push("/");
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Unable to open document.");
          return;
        }
        setDoc(data.document);
        setTitle(data.document.title);
        setContent(data.document.content);
      } catch {
        setError("Network error while loading document.");
      } finally {
        setLoading(false);
      }
    }
    loadDoc();
  }, [id, router]);

// Real-time background sync (every 1.5s + on window focus)
  useEffect(() => {
    let isMounted = true;

    const isActivelyEditing = () =>
      saveStateRef.current === "unsaved" ||
      saveStateRef.current === "saving" ||
      Date.now() - lastLocalEditRef.current < 1200;

    async function syncLatest() {
      if (isActivelyEditing()) {
        return;
      }

      try {
        const res = await fetch(`/api/documents/${id}`, { cache: "no-store" });
        if (!res.ok || !isMounted) return;
        const data = await res.json();
        const remote: DocumentData | undefined = data?.document;
        if (!remote) return;

        if (isActivelyEditing()) {
          return;
        }

        setDoc((prev) =>
          prev
            ? {
                ...prev,
                canEdit: remote.canEdit,
                role: remote.role,
                sharedWith: remote.sharedWith,
                updatedAt: remote.updatedAt,
              }
            : remote
        );

        setTitle((prevTitle) => (prevTitle !== remote.title ? remote.title : prevTitle));
        setContent((prevContent) =>
          prevContent !== remote.content ? remote.content : prevContent
        );
      } catch {
        // Ignore transient network hiccups during background polling
      }
    }

    const interval = setInterval(syncLatest, 1500);
    window.addEventListener("focus", syncLatest);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", syncLatest);
    };
  }, [id]);

  const saveDocument = useCallback(
    async (nextTitle: string, nextContent: string) => {
      if (!doc?.canEdit) return;
      setSaveState("saving");
      try {
        const res = await fetch(`/api/documents/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: nextTitle.trim() || "Untitled Document",
            content: nextContent,
          }),
        });
        if (res.status === 403) {
          setDoc((prev) => (prev ? { ...prev, canEdit: false, role: "viewer" } : prev));
          setSaveState("forbidden");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setDoc(data.document);
          setSaveState("saved");
        } else {
          setSaveState("forbidden");
        }
      } catch {
        setSaveState("forbidden");
      }
    },
    [id, doc?.canEdit]
  );

  // Fast 500ms debounced auto-save
  useEffect(() => {
    if (!doc || !doc.canEdit || saveState !== "unsaved") return;
    const timer = setTimeout(() => {
      saveDocument(title, content);
    }, 500);
    return () => clearTimeout(timer);
  }, [title, content, doc, saveState, saveDocument]);

  async function handleExportPdf() {
    setShowExportMenu(false);
    setExportingPdf(true);

    try {
      // Dynamic import so html2pdf only executes on the client browser
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default;

      const safeTitle = (title.trim() || "Untitled Document").replace(/[^a-z0-9-_ ]/gi, "_");

      // Build clean printable container with crisp typography
      const container = document.createElement("div");
      container.style.fontFamily = "Arial, Helvetica, sans-serif";
      container.style.color = "#0f172a";
      container.style.backgroundColor = "#ffffff";
      container.style.padding = "12px";
      container.style.lineHeight = "1.65";
      container.style.fontSize = "14px";

      container.innerHTML = `
        <style>
          h1 { font-size: 24px; font-weight: 800; margin: 0 0 12px 0; color: #0f172a; }
          h2 { font-size: 19px; font-weight: 700; margin: 18px 0 8px 0; color: #1e293b; }
          h3 { font-size: 16px; font-weight: 600; margin: 14px 0 6px 0; color: #1e293b; }
          p { margin: 0 0 10px 0; color: #0f172a; }
          ul { list-style-type: disc; padding-left: 24px; margin: 0 0 12px 0; }
          ol { list-style-type: decimal; padding-left: 24px; margin: 0 0 12px 0; }
          li { margin-bottom: 4px; }
          .doc-header-title {
            font-size: 26px;
            font-weight: 800;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 18px;
            color: #0f172a;
          }
        </style>
        <div class="doc-header-title">${title.trim() || "Untitled Document"}</div>
        <div>${content}</div>
      `;

      await html2pdf()
        .set({
          margin: [15, 15, 15, 15],
          filename: `${safeTitle}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(container)
        .save();
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  }

  function handleExportHtml() {
    setShowExportMenu(false);
    const blob = new Blob(
      [
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${content}</body></html>`,
      ],
      { type: "text/html;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "document").replace(/[^a-z0-9-_]/gi, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleAppendFile(file: File) {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".docx") && !lower.endsWith(".md") && !lower.endsWith(".txt")) {
      alert("Only .docx, .md, and .txt files are supported.");
      return;
    }

    setImportingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentId", id);

      const res = await fetch("/api/documents/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to insert file.");
        return;
      }

      if (data.appendedHtml) {
        lastLocalEditRef.current = Date.now();
        setContent(data.appendedHtml);
        setSaveState("saved");
      }
    } catch {
      alert("Network error while inserting file.");
    } finally {
      setImportingFile(false);
    }
  }

  async function handleShareSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shareEmail.trim()) return;

    setShareLoading(true);
    setShareMessage(null);

    try {
      const res = await fetch(`/api/documents/${id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: shareEmail.trim(),
          role: shareRole,
          action: "add",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setShareMessage({ type: "error", text: data.error || "Failed to share document." });
        return;
      }

      setDoc((prev) => (prev ? { ...prev, sharedWith: data.sharedWith } : prev));
      setShareEmail("");
      setShareMessage({
        type: "success",
        text: data.message || `Shared as ${shareRole === "editor" ? "Editor" : "Viewer"}!`,
      });
    } catch {
      setShareMessage({ type: "error", text: "Network error while sharing." });
    } finally {
      setShareLoading(false);
    }
  }

  async function handleRoleChange(targetEmail: string, newRole: "editor" | "viewer") {
    setUpdatingEmail(targetEmail);
    setShareMessage(null);
    try {
      const res = await fetch(`/api/documents/${id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          role: newRole,
          action: "update_role",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDoc((prev) => (prev ? { ...prev, sharedWith: data.sharedWith } : prev));
        setShareMessage({
          type: "success",
          text: `Updated ${targetEmail} to ${newRole === "editor" ? "Editor" : "Viewer"}.`,
        });
      }
    } finally {
      setUpdatingEmail(null);
    }
  }

  async function handleRemoveCollaborator(emailToRemove: string) {
    const res = await fetch(`/api/documents/${id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailToRemove, action: "remove" }),
    });
    if (res.ok) {
      const data = await res.json();
      setDoc((prev) => (prev ? { ...prev, sharedWith: data.sharedWith } : prev));
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this document?")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060913]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060913] px-4 text-center text-white">
        <AlertCircle className="w-11 h-11 text-rose-400 mb-3" />
        <h1 className="text-lg font-bold">{error || "Document unavailable"}</h1>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl cursor-pointer"
        >
          Back to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060913] bg-studio-grid text-slate-100 pb-24 relative">
      <div className="fixed top-0 left-1/3 w-[36rem] h-[20rem] rounded-full bg-indigo-600/15 blur-[130px] pointer-events-none" />

      <header className="bg-[#060913]/85 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => router.push("/")}
              title="Back to Workspace"
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-fuchsia-500 items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/25">
              <FileText className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={title}
                disabled={!doc.canEdit}
                onChange={(e) => {
                  lastLocalEditRef.current = Date.now();
                  setTitle(e.target.value);
                  setSaveState("unsaved");
                }}
                onBlur={() => saveDocument(title, content)}
                aria-label="Document title"
                className="w-full font-bold text-base sm:text-lg text-white bg-transparent border border-transparent hover:border-white/15 focus:border-indigo-500 focus:bg-slate-900 disabled:hover:border-transparent rounded-lg px-2 py-0.5 focus:outline-none truncate"
              />
              <div className="flex items-center gap-2 px-2 text-xs text-slate-400">
                <span
                  className={`font-semibold ${
                    doc.isOwner
                      ? "text-indigo-300"
                      : doc.canEdit
                      ? "text-emerald-300"
                      : "text-amber-300"
                  }`}
                >
                  {doc.isOwner
                    ? "Owner"
                    : `Shared by ${doc.ownerName} (${doc.canEdit ? "Editor" : "Viewer"})`}
                </span>
                {doc.canEdit && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {saveState === "saving" && (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> Saving...
                        </>
                      )}
                      {saveState === "saved" && (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Saved to cloud
                        </>
                      )}
                      {saveState === "unsaved" && "Unsaved changes..."}
                      {saveState === "forbidden" && (
                        <span className="text-rose-400 font-medium">Read-only access</span>
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Export Dropdown (PDF + HTML) */}
            <div ref={exportMenuRef} className="relative">
              <button
                type="button"
                disabled={exportingPdf}
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-slate-100 text-xs sm:text-sm font-semibold transition disabled:opacity-60 cursor-pointer"
              >
                {exportingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                ) : (
                  <Download className="w-4 h-4 text-indigo-300" />
                )}
                <span>{exportingPdf ? "Generating PDF..." : "Export"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl py-1.5 z-40 backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-white hover:bg-indigo-600/30 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <p className="font-bold">Download as PDF (.pdf)</p>
                      <p className="text-[10px] text-slate-400">Formatted A4 document</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportHtml}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-200 hover:bg-white/10 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <p className="font-bold">Download as HTML (.html)</p>
                      <p className="text-[10px] text-slate-400">Clean web markup</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {doc.canEdit && (
              <button
                onClick={() => saveDocument(title, content)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </button>
            )}

            <button
              onClick={() => {
                setShareMessage(null);
                setShowShareModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Share
              {doc.sharedWith.length > 0 && (
                <span className="bg-white/25 text-white text-xs px-1.5 py-0.2 rounded-full">
                  {doc.sharedWith.length}
                </span>
              )}
            </button>

            {doc.isOwner && (
              <button
                onClick={handleDelete}
                title="Delete document"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        <RichTextEditor
          initialContent={content}
          editable={doc.canEdit}
          importingFile={importingFile}
          onImportFile={handleAppendFile}
          onChange={(updatedHtml) => {
            lastLocalEditRef.current = Date.now();
            setContent(updatedHtml);
            setSaveState("unsaved");
          }}
        />
      </main>

      {showShareModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full p-7 shadow-2xl border border-white/15">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold text-white truncate pr-2">
                Share &ldquo;{doc.title}&rdquo;
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-5">
              Owner: <strong className="text-slate-200">{doc.ownerName}</strong> ({doc.ownerEmail})
            </p>

            {doc.isOwner ? (
              <form onSubmit={handleShareSubmit} className="space-y-3 mb-5">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                  Invite person by email &amp; choose permission
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="teammate@example.com"
                    className="flex-1 px-3.5 py-2.5 bg-white/[0.06] focus:bg-slate-950 border border-white/15 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <select
                    value={shareRole}
                    onChange={(e) => setShareRole(e.target.value as "editor" | "viewer")}
                    aria-label="Permission role"
                    className="px-3 py-2.5 bg-slate-800 border border-white/15 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>

                  <button
                    type="submit"
                    disabled={shareLoading}
                    className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:opacity-95 disabled:opacity-60 text-white text-sm font-bold rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {shareLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Share
                  </button>
                </div>

                {shareMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium ${
                      shareMessage.type === "error"
                        ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                        : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {shareMessage.text}
                  </div>
                )}
              </form>
            ) : (
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 mb-5">
                Only the document owner can invite people or change access roles.
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2.5">
                People with Access ({doc.sharedWith.length + 1})
              </h4>
              <ul className="space-y-2 max-h-52 overflow-y-auto">
                <li className="flex items-center justify-between text-sm bg-indigo-500/15 border border-indigo-400/25 px-3.5 py-2.5 rounded-xl">
                  <span className="text-white font-medium truncate">{doc.ownerEmail}</span>
                  <span className="text-xs font-bold text-indigo-300">Owner</span>
                </li>

                {doc.sharedWith.map((collab) => (
                  <li
                    key={collab.email}
                    className="flex items-center justify-between gap-2 text-sm bg-white/[0.05] border border-white/10 px-3.5 py-2.5 rounded-xl"
                  >
                    <span className="text-slate-200 truncate">{collab.email}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.isOwner ? (
                        <>
                          <select
                            value={collab.role}
                            disabled={updatingEmail === collab.email}
                            onChange={(e) =>
                              handleRoleChange(
                                collab.email,
                                e.target.value as "editor" | "viewer"
                              )
                            }
                            aria-label={`Change role for ${collab.email}`}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              collab.role === "editor"
                                ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                                : "bg-amber-950 text-amber-300 border-amber-500/40"
                            }`}
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>

                          <button
                            onClick={() => handleRemoveCollaborator(collab.email)}
                            className="text-xs font-semibold text-rose-400 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            collab.role === "editor"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {collab.role === "editor" ? "Editor" : "Viewer"}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#060913]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      }
    >
      <DocumentEditorContent params={params} />
    </Suspense>
  );
}