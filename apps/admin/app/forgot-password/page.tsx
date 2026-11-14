"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"REQUEST" | "VERIFY" | "RESET" | "SUCCESS">("REQUEST");
  const [identifier, setIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError("Please enter your registered phone number or email address.");
      return;
    }

    setLoading(true);
    // Simulate lookup & SMS dispatch
    setTimeout(() => {
      setLoading(false);
      setStep("VERIFY");
    }, 800);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otpCode.trim().length < 4) {
      setError("Please enter a valid verification code.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("RESET");
    }, 600);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("SUCCESS");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -top-10 -left-10" />
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -bottom-10 -right-10" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Top return */}
        <Link
          href="/login"
          className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              K
            </div>
            <span className="text-xl font-black text-white">KekeGO</span>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">Account Recovery</h1>
          <p className="text-xs text-slate-400">
            Reset credentials for Passenger, Driver Partner, or Staff accounts
          </p>
        </div>

        {/* Progress tracker */}
        <div className="flex items-center justify-center space-x-2">
          {(["REQUEST", "VERIFY", "RESET", "SUCCESS"] as const).map((s, idx) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === s
                  ? "w-8 bg-amber-500"
                  : idx < ["REQUEST", "VERIFY", "RESET", "SUCCESS"].indexOf(step)
                  ? "w-4 bg-emerald-500"
                  : "w-3 bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Identifier request */}
        {step === "REQUEST" && (
          <form
            onSubmit={handleRequestReset}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl"
          >
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Registered Phone or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 08012345678 or your.email@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                />
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              </div>
              <p className="text-[10px] text-slate-500 pt-0.5">
                We will dispatch an SMS recovery code via Nigerian telco gateways.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Dispatching Code...</span>
              ) : (
                <>
                  <span>Send Recovery Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP verification */}
        {step === "VERIFY" && (
          <form
            onSubmit={handleVerifyOtp}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl"
          >
            <div className="text-center space-y-1 pb-2">
              <div className="inline-flex p-3 rounded-full bg-amber-500/10 text-amber-400 mb-1">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-white">Enter Verification Code</h2>
              <p className="text-xs text-slate-400">
                A 6-digit OTP was dispatched to <span className="text-white font-mono">{identifier}</span>
              </p>
            </div>

            <div className="space-y-1">
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="e.g. 741982"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 text-center tracking-widest text-lg font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                <span>Demo Code: Any 4-6 digits or 7419</span>
                <button
                  type="button"
                  onClick={() => setOtpCode("741982")}
                  className="text-amber-400 hover:underline"
                >
                  Quick Fill
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Verify Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep("REQUEST")}
                className="text-xs text-slate-400 hover:text-white"
              >
                Change Phone or Email
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === "RESET" && (
          <form
            onSubmit={handleResetPassword}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl"
          >
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">New Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Confirm New Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
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
                <span>Updating Password...</span>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 4: Success confirmation */}
        {step === "SUCCESS" && (
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">Password Updated!</h2>
              <p className="text-xs text-slate-400">
                Your credentials have been securely updated. You can now log into your account.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/login"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition block"
              >
                <span>Sign In as Passenger</span>
              </Link>
              <Link
                href="/driver/login"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition block"
              >
                <span>Sign In as Driver</span>
              </Link>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500">
          Need operational support? Reach out at{" "}
          <span className="text-amber-400 font-mono">support@kekego.ng</span>
        </div>
      </div>
    </div>
  );
}
