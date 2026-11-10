"use client";

import React, { useState } from "react";
import { apiRequest } from "../../src/lib/api";
import { useAuth } from "../../src/context/AuthContext";
import { UserRole } from "@kekego/shared";
import { Lock, Phone, AlertCircle, ArrowRight } from "lucide-react";

interface LoginResponse {
  user: {
    id: string;
    phoneNumber: string;
    email?: string | null;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
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
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });

      if (data.user.role !== UserRole.ADMIN) {
        setError("Access denied: You must hold an ADMIN role to access the back-office console.");
        return;
      }

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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4">
      {/* Background Glow */}
      <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -top-10 -left-10" />
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -bottom-10 -right-10" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-2xl shadow-lg shadow-amber-500/20">
            K
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Kekego Ops</h1>
            <p className="text-xs text-slate-400">Back-office Administration Console</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Admin Phone or Email
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="+2348011111111 or admin@kekego.ng"
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
                <span>Sign in to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400">
            Initial Seed Admin: <span className="font-mono text-slate-300">+2348011111111</span> / <span className="font-mono text-slate-300">admin@kekego.ng</span>
          </p>
        </div>
      </div>
    </div>
  );
}
