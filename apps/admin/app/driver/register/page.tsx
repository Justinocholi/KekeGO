"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth, type AppUser } from "../../../src/context/AuthContext";
import { apiRequest } from "../../../src/lib/api";
import {
  Car,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function DriverRegisterPage() {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    licenseNumber: "",
    plateNumber: "",
    make: "Bajaj",
    model: "RE 4S",
    color: "Yellow",
    year: 2023,
  });

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
      }>("/auth/register/driver", {
        method: "POST",
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber.startsWith("+")
            ? formData.phoneNumber
            : `+234${formData.phoneNumber.replace(/^0/, "")}`,
          email: formData.email ? formData.email : undefined,
          password: formData.password,
          licenseNumber: formData.licenseNumber,
          vehicle: {
            plateNumber: formData.plateNumber.toUpperCase(),
            make: formData.make,
            model: formData.model,
            color: formData.color,
            year: Number(formData.year),
            type: "KEKE_NAPEP",
          },
        }),
      });

      if (res && res.tokens) {
        // Automatically stores token and routes driver to onboarding
        login(res.tokens.accessToken, res.user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Driver registration failed. Check that phone, license, and plate are unique.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-lg space-y-6 my-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              K
            </div>
            <span className="text-xl font-black text-white">KekeGO</span>
          </Link>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Driver Onboarding & Fleet Enrollment</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Register as a Keke Driver</h1>
          <p className="text-xs text-slate-400">
            Submit your personal credentials and vehicle particulars to start earning 80% net daily
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
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
          {/* Section 1: Personal Credentials */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5" />
              <span>1. Operator Information</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="e.g. Musa"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="e.g. Ibrahim"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="08022222222"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">License Number</label>
                <input
                  type="text"
                  required
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="NAS-19283-K"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono uppercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 8 chars (1 uppercase, 1 number e.g. DriverPass123!)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Section 2: Vehicle Details */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Car className="w-3.5 h-3.5" />
              <span>2. Commercial Tricycle Particulars</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Plate Number (Nasarawa)</label>
                <input
                  type="text"
                  required
                  value={formData.plateNumber}
                  onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                  placeholder="LAF-882-XA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono uppercase font-bold text-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Make & Model</label>
                <select
                  value={`${formData.make} ${formData.model}`}
                  onChange={(e) => {
                    const [make, ...rest] = e.target.value.split(" ");
                    setFormData({ ...formData, make: make || "Bajaj", model: rest.join(" ") || "RE 4S" });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Bajaj RE 4S">Bajaj RE 4S (Standard)</option>
                  <option value="TVS King Deluxe">TVS King Deluxe</option>
                  <option value="Piaggio Ape City">Piaggio Ape City</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Livery Color</label>
                <input
                  type="text"
                  required
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Yellow"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Manufacturing Year</label>
                <input
                  type="number"
                  min={2005}
                  max={2026}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2"
          >
            <span>{loading ? "Submitting Registration..." : "Submit Driver Application"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer links */}
        <div className="text-center space-y-3 text-xs text-slate-400">
          <p>
            Already registered as a driver?{" "}
            <Link href="/driver/login" className="text-amber-400 font-bold hover:underline">
              Sign In Here
            </Link>
          </p>
          <div className="pt-2 border-t border-slate-900 flex justify-center space-x-4">
            <Link href="/login" className="text-slate-400 hover:text-white">
              Passenger Sign In
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
