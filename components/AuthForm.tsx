"use client";

import { useState } from "react";
import {
  FileText,
  Loader2,
  Lock,
  Mail,
  User,
  Sparkles,
  Share2,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

export default function AuthForm({ onSuccess }: { onSuccess: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload = mode === "signup" ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        return;
      }

      if (mode === "signup") {
        setMode("login");
        setPassword("");
        setSuccessMsg("Account created! Please sign in with your email and password.");
        return;
      }

      onSuccess(data.user);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-white flex flex-col justify-between">
      {/* Vivid Ambient Mesh Gradients */}
      <div className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full bg-indigo-600/35 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full bg-fuchsia-600/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[32rem] h-[32rem] rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

      {/* Top Glass Navigation Bar */}
      <header className="relative z-10 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">Ajaia Docs</span>
            <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              v1.0 Cloud Workspace
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>MongoDB Atlas Synced</span>
          </div>
        </div>
      </header>

      {/* Main Split Content */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 py-10 my-auto grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
        {/* Left Hero Showcase */}
        <div className="md:col-span-6 lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Collaborative Rich-Text &amp; Markdown Workspace
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
            Turn ideas and{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
              Markdown drafts
            </span>{" "}
            into shared team docs.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
            Create formatted documents, import <code className="text-indigo-300">.md</code> or{" "}
            <code className="text-indigo-300">.txt</code> files directly into editable pages, and manage owner/collaborator permissions in real time.
          </p>

          {/* Preview Card */}
          <div className="bg-slate-900/80 border border-white/15 rounded-2xl p-5 shadow-2xl backdrop-blur-xl max-w-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-medium text-slate-300">
                  Product_Launch_Plan.md
                </span>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ● Live Cloud Sync
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-1.5" />
                <p className="text-xs font-bold text-white">Rich Editor</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Headings, bold, lists</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <UploadCloud className="w-4 h-4 text-sky-400 mb-1.5" />
                <p className="text-xs font-bold text-white">File Import</p>
                <p className="text-[11px] text-slate-400 mt-0.5">.md &amp; .txt conversion</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <Share2 className="w-4 h-4 text-fuchsia-400 mb-1.5" />
                <p className="text-xs font-bold text-white">Access Control</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Owner &amp; shared roles</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Elevated Auth Card */}
        <div className="md:col-span-6 lg:col-span-5">
          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl shadow-indigo-950/50 border border-white/20 p-7 sm:p-9 max-w-md mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900">
                {mode === "login" ? "Sign in to Ajaia Docs" : "Create your account"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {mode === "login"
                  ? "Enter your credentials to open your workspace."
                  : "Register in seconds to start creating and sharing docs."}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccessMsg("");
                }}
                className={`py-2 text-sm font-bold rounded-lg transition cursor-pointer ${
                  mode === "login"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setSuccessMsg("");
                }}
                className={`py-2 text-sm font-bold rounded-lg transition cursor-pointer ${
                  mode === "signup"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                  {successMsg}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:opacity-95 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition cursor-pointer mt-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {mode === "signup" ? "Create Free Account" : "Enter Workspace"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 border-t border-white/10 py-4 text-center text-xs text-slate-400">
        Ajaia Collaborative Document Editor • Built with Next.js, Tailwind CSS &amp; Tiptap
      </footer>
    </div>
  );
}