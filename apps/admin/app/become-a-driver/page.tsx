"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";

export default function BecomeADriverPage() {
  const [dailyTrips, setDailyTrips] = useState(15);
  const avgFare = 500;
  const grossDaily = dailyTrips * avgFare;
  const netDaily = Math.round(grossDaily * 0.8);
  const netMonthly = netDaily * 26; // 26 working days

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              K
            </div>
            <div>
              <span className="text-lg font-black text-white">KekeGO</span>
              <p className="text-[10px] text-slate-400">Driver Partner Network</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4 text-xs font-bold">
            <Link href="/" className="text-slate-400 hover:text-white flex items-center space-x-1">
              <ChevronLeft className="w-4 h-4" />
              <span>Back Home</span>
            </Link>
            <Link
              href="/driver/login"
              className="px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-200 transition"
            >
              Driver Login
            </Link>
            <Link
              href="/driver/register"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20"
            >
              Sign Up to Drive
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Nasarawa Ministry of Transport Verified Partner</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Drive Your Keke in Nasarawa & <span className="text-amber-400">Keep 80% Net</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Get steady commercial ride dispatches across Lafia, Keffi, Karu, Akwanga, and Doma. 
            Enjoy transparent payouts, fuel efficiency, and respectful passenger interactions.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/driver/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/30 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
            >
              <span>Start Driver Registration</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/driver/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold text-xs transition"
            >
              Existing Driver Sign In
            </Link>
          </div>
        </div>

        {/* Interactive Earnings Calculator */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>Estimate Your Daily & Monthly Earnings</span>
              </h2>
              <p className="text-xs text-slate-400">Based on standard Nasarawa urban commercial rates</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              80% Payout Rate
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">How many trips can you complete per day?</span>
              <span className="font-bold text-amber-400 font-mono text-base">{dailyTrips} Trips / Day</span>
            </div>
            <input
              type="range"
              min={5}
              max={35}
              value={dailyTrips}
              onChange={(e) => setDailyTrips(Number(e.target.value))}
              className="w-full accent-amber-500 bg-slate-950 rounded-lg h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>5 trips (Part-time)</span>
              <span>20 trips (Standard)</span>
              <span>35 trips (Full shift)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Gross Daily Fares</p>
              <p className="text-xl font-bold font-mono text-white mt-1">₦{grossDaily.toLocaleString()} NGN</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Average ₦500 per passenger trip</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Your Net Daily Take-Home</p>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">₦{netDaily.toLocaleString()} NGN</p>
              <p className="text-[10px] text-slate-400 mt-0.5">After 15% platform & 5% cooperative share</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Estimated Monthly Income</p>
              <p className="text-xl font-bold font-mono text-amber-400 mt-1">₦{netMonthly.toLocaleString()} NGN</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Calculated over 26 operational days</p>
            </div>
          </div>
        </section>

        {/* Requirements Checklist */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
          <h2 className="text-lg font-bold text-white">What You Need to Get Approved</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Valid Nigerian Driver&apos;s License (Class E)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Or temporary valid renewal permit</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Commercial Tricycle (Bajaj / TVS / Piaggio)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Yellow urban livery with valid plate number</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">National Identification Number (NIN)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Government identity card or digital slip</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Nasarawa Bank Account for Payouts</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Direct transfers via Paystack weekly</p>
              </div>
            </div>
          </div>

          <div className="pt-4 text-center">
            <Link
              href="/driver/register"
              className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
            >
              <span>Submit Your Application Online</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
