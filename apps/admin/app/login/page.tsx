"use client";

import React, { useState } from "react";
import { apiRequest } from "../../src/lib/api";
import { useAuth, type AppUser } from "../../src/context/AuthContext";
import { UserRole } from "@kekego/shared";
import { Lock, Phone, AlertCircle, ArrowRight, UserCheck, Shield, Car, Sparkles } from "lucide-react";

interface LoginResponse {
  user: AppUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresInSeconds: number;
  };
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, switchRole } = useAuth();

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });

      login(data.tokens.accessToken, data.user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed. Please verify credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await switchRole(role);
    } catch {
      setError("Quick login failed. Make sure backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      {/* Ambient background glows */}
      <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -top-10 -left-10" />
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -bottom-10 -right-10" />

      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex items-center space-x-3.5 mb-6 pb-6 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-2xl shadow-lg shadow-amber-500/20 shrink-0">
            K
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Kekego Platform Portal</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                MVP Showcase
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any role to experience the two-sided ride hailing & management MVP
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Instant Demo Login Cards */}
        <div className="mb-8">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Role Access (One-Click)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Passenger Card */}
            <button
              type="button"
              onClick={() => handleQuickLogin(UserRole.PASSENGER)}
              disabled={isSubmitting}
              className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 text-left transition group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-amber-400">Rider / User</span>
              </div>
              <h3 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                Passenger Portal
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Book rides, see dynamic fare estimates, track driver & pay.
              </p>
            </button>

            {/* Driver Card */}
            <button
              type="button"
              onClick={() => handleQuickLogin(UserRole.DRIVER)}
              disabled={isSubmitting}
              className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 text-left transition group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-emerald-400">Driver</span>
              </div>
              <h3 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                Driver Cockpit
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Go online, accept dispatches, start trip with OTP & cash earnings.
              </p>
            </button>

            {/* Admin Card */}
            <button
              type="button"
              onClick={() => handleQuickLogin(UserRole.ADMIN)}
              disabled={isSubmitting}
              className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 text-left transition group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-purple-400">Back-office</span>
              </div>
              <h3 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                Super Admin
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Live dispatch map, fleet approvals, finance ledger & pricing.
              </p>
            </button>
          </div>
        </div>

        {/* Manual Credentials Form */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-3 text-slate-400 font-semibold tracking-wider text-[10px]">
              Or Sign In With Custom Account
            </span>
          </div>
        </div>

        <form onSubmit={handleManualLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Phone Number or Email
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="+2348011111111, passenger.amina@gmail.com, etc."
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign in to Selected Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Territory: Nasarawa State (Lafia, Karu, Keffi, Akwanga, Doma)</span>
          <span className="font-mono text-amber-400">Default: Kekego@2026</span>
        </div>
      </div>
    </div>
  );
}
