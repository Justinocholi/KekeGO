"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth, type AppUser } from "../../src/context/AuthContext";
import { apiRequest } from "../../src/lib/api";
import {
  User,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function PassengerRegisterPage() {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Call Fastify API endpoint
      const res = await apiRequest<{
        user: AppUser;
        tokens: { accessToken: string; refreshToken: string };
      }>("/auth/register/passenger", {
        method: "POST",
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber.startsWith("+")
            ? formData.phoneNumber
            : `+234${formData.phoneNumber.replace(/^0/, "")}`,
          email: formData.email ? formData.email : undefined,
          password: formData.password,
        }),
      });

      if (res && res.tokens) {
        login(res.tokens.accessToken, res.user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please check your inputs.";
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
          <h1 className="text-2xl font-black text-white tracking-tight">Create Passenger Account</h1>
          <p className="text-xs text-slate-400">
            Book commercial tricycles easily across Lafia, Keffi, and Karu
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">First Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Amina"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Last Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Yusuf"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Phone Number (Nigerian)</label>
            <div className="relative">
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="08012345678"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Email Address (Optional)</label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="amina@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min. 8 characters"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2"
          >
            <span>{loading ? "Creating Account..." : "Create Passenger Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Alternate Navigation Links */}
        <div className="text-center space-y-3 text-xs text-slate-400">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="text-amber-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
          <div className="pt-2 border-t border-slate-900 flex justify-center space-x-4">
            <Link href="/driver/register" className="text-emerald-400 hover:underline">
              Want to drive? Register as Driver
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
