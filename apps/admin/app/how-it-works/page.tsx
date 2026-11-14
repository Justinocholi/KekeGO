"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
} from "lucide-react";

export default function HowItWorksPage() {
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
              <p className="text-[10px] text-slate-400">Nasarawa State</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4 text-xs font-bold">
            <Link href="/" className="text-slate-400 hover:text-white flex items-center space-x-1">
              <ChevronLeft className="w-4 h-4" />
              <span>Back Home</span>
            </Link>
            <Link
              href="/passenger"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20"
            >
              Book a Ride
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Complete User Guide</span>
          <h1 className="text-4xl font-black text-white tracking-tight">How KekeGO Works</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Everything you need to know about booking commercial tricycles or driving with KekeGO in Nasarawa State.
          </p>
        </div>

        {/* Section 1: For Passengers */}
        <section className="space-y-8 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              🧍
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">For Passengers & Daily Commuters</h2>
              <p className="text-xs text-slate-400">Hail a Bajaj or TVS tricycle in seconds</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-mono font-bold text-amber-400">STEP 01</span>
              <h3 className="text-sm font-bold text-white">Real-Time Search</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Type your destination or pick verified landmarks like Lafia Modern Market, NSUK, or Mararaba Orange Market.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-mono font-bold text-amber-400">STEP 02</span>
              <h3 className="text-sm font-bold text-white">Transparent Fares</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                See exact fare estimates in Naira before requesting. Choose between Standard shared, Charter private, or Cargo.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-mono font-bold text-amber-400">STEP 03</span>
              <h3 className="text-sm font-bold text-white">4-Digit Security OTP</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get paired with the nearest driver. Share your 4-digit start OTP when you board to ensure verified commencement.
              </p>
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/passenger"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
            >
              <span>Try Booking a Ride Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Section 2: For Drivers */}
        <section className="space-y-8 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              🛺
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">For Keke Drivers & Operators</h2>
              <p className="text-xs text-slate-400">Turn your tricycle into steady daily earnings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-mono font-bold text-emerald-400">STEP 01</span>
              <h3 className="text-sm font-bold text-white">Fast Digital Onboarding</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Register your vehicle plate number, valid driver&apos;s license, and ID. Get reviewed and approved by administrators.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-mono font-bold text-emerald-400">STEP 02</span>
              <h3 className="text-sm font-bold text-white">Shift Availability</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Toggle your shift Online anytime. Receive incoming dispatch cards within 3.5km with a 15-second countdown timer.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-mono font-bold text-emerald-400">STEP 03</span>
              <h3 className="text-sm font-bold text-white">Keep 80% Net</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Take home 80% of every fare. Only 15% platform commission and 5% cooperative partner fee are deducted.
              </p>
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/become-a-driver"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
            >
              <span>Learn About Becoming a Driver</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
