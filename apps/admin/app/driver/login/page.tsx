"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth, type AppUser } from "../../../src/context/AuthContext";
import { apiRequest } from "../../../src/lib/api";
import {
  Car,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function DriverLoginPage() {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("driver.musa@kekego.ng");
  const [password, setPassword] = useState("DriverPass123!");
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
        // Unified AuthContext will automatically redirect based on real verified role
        login(res.tokens.accessToken, res.user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid driver credentials. Please check phone/email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              K
            </div>
            <span className="text-xl font-black text-white">KekeGO</span>
          </Link>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Car className="w-3.5 h-3.5" />
            <span>Driver Partner Portal</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Driver Sign In</h1>
          <p className="text-xs text-slate-400">
            Access your active shift cockpit, incoming dispatches, and shift earnings
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Registered Phone or Email</label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="08022222222 or driver.musa@kekego.ng"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
              />
              <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <label className="font-semibold text-slate-300">Driver Password</label>
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
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Driver Cockpit"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Track Card */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-white">Demo Verified Driver</p>
            <p className="text-[10px] text-slate-400">Musa Ibrahim • Bajaj RE 4S (LAF-882-XA)</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIdentifier("driver.musa@kekego.ng");
              setPassword("DriverPass123!");
            }}
            className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-bold text-[10px] hover:bg-amber-500/30 transition"
          >
            Fill Musa
          </button>
        </div>

        {/* Cross-Role Navigation */}
        <div className="text-center space-y-3 text-xs text-slate-400">
          <p>
            Don&apos;t have a driver account yet?{" "}
            <Link href="/driver/register" className="text-amber-400 font-bold hover:underline">
              Register as Driver
            </Link>
          </p>
          <div className="pt-2 border-t border-slate-900 flex justify-center space-x-4">
            <Link href="/login" className="text-slate-400 hover:text-white">
              Passenger Login
            </Link>
            <span>•</span>
            <Link href="/admin/login" className="text-slate-400 hover:text-white">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
