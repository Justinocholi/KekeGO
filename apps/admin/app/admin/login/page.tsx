"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth, type AppUser } from "../../../src/context/AuthContext";
import { apiRequest } from "../../../src/lib/api";
import { UserRole } from "@kekego/shared";
import {
  ShieldAlert,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Server,
  KeyRound,
} from "lucide-react";

export default function AdminLoginPage() {
  const { login, switchRole } = useAuth();

  const [identifier, setIdentifier] = useState("admin@kekego.ng");
  const [password, setPassword] = useState("AdminPass123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest<{
        user: AppUser;
        tokens: { accessToken: string; refreshToken: string };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });

      if (res && res.tokens) {
        // Unified AuthContext redirects dynamically based on verified backend role
        login(res.tokens.accessToken, res.user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid administrative credentials or unauthorized device.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await switchRole(UserRole.ADMIN);
    } catch {
      setError("Unable to authenticate super admin demo session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden">
      {/* Ambient background security glows */}
      <div className="absolute w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none -top-24 -right-24" />
      <div className="absolute w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none -bottom-24 -left-24" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Top return link */}
        <div className="flex items-center justify-between text-xs">
          <Link
            href="/"
            className="inline-flex items-center space-x-1 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Home</span>
          </Link>
          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
            RESTRICTED ACCESS
          </span>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/25 group-hover:scale-105 transition">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="text-xl font-black text-white tracking-tight block">
                KekeGO Operations
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400">
                Command & Control Portal
              </span>
            </div>
          </Link>
          <p className="text-xs text-slate-400 pt-1">
            Nasarawa State Commercial Tricycle Telematics & Dispatch Platform
          </p>
        </div>

        {/* Security Alert / Error */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Admin Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white">Instant Demo Admin Login</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300">
              Super Admin
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            One-click authorization to access live dispatch HUD, driver verification queue, and financial ledgers.
          </p>
          <button
            type="button"
            onClick={handleInstantDemoLogin}
            disabled={loading}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Launch Operations Command Center</span>
          </button>
        </div>

        {/* Credentials Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl"
        >
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Standard Credential Authentication</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">
              Admin Identity (Email or Phone)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@kekego.ng"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <label className="font-semibold text-slate-300">Password</label>
              <Link
                href="/forgot-password"
                className="text-amber-400 hover:text-amber-300 text-[10px] transition"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Admin Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Role-aware routing enabled</span>
            <span className="font-mono text-purple-400 text-[10px]">Lafia Command Node</span>
          </div>
        </form>

        {/* Portal Switching links */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 space-y-2 text-center text-xs text-slate-400">
          <p className="text-[11px]">Looking for a different portal?</p>
          <div className="flex items-center justify-center space-x-4 pt-1">
            <Link
              href="/login"
              className="text-amber-400 hover:text-amber-300 font-semibold transition"
            >
              Passenger App &rarr;
            </Link>
            <span className="text-slate-700">•</span>
            <Link
              href="/driver/login"
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition"
            >
              Driver Cockpit &rarr;
            </Link>
          </div>
        </div>

        {/* Security Disclaimer */}
        <div className="text-center text-[10px] text-slate-500 space-y-1">
          <p className="flex items-center justify-center space-x-1">
            <Server className="w-3 h-3 text-slate-500" />
            <span>KekeGO Fleet Infrastructure • Nasarawa State Command Node</span>
          </p>
          <p>
            Unauthorized administrative access is strictly prohibited and cryptographically logged.
          </p>
        </div>
      </div>
    </div>
  );
}
