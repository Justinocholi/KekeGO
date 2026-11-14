"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Car,
  Sparkles,
  Lock,
  Smartphone,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

const COVERAGE_HUBS = [
  {
    city: "Lafia Central",
    status: "ACTIVE SERVICE ZONE",
    landmarks: "Lafia Modern Market, UniLafia, DASH, Jos Road",
    tripsDaily: "3,500+ Daily Rides",
    badge: "Urban Hub",
  },
  {
    city: "Keffi Corridor",
    status: "ACTIVE SERVICE ZONE",
    landmarks: "NSUK Main Campus, Keffi Roundabout, FMC Keffi",
    tripsDaily: "2,200+ Daily Rides",
    badge: "University Axis",
  },
  {
    city: "Karu-Mararaba",
    status: "ACTIVE SERVICE ZONE",
    landmarks: "Orange Market, Karu International, Nyanya Border",
    tripsDaily: "4,800+ Daily Rides",
    badge: "Metropolitan",
  },
  {
    city: "Akwanga Hub",
    status: "ACTIVE SERVICE ZONE",
    landmarks: "Akwanga Central Roundabout, College of Education",
    tripsDaily: "1,100+ Daily Rides",
    badge: "Transit Junction",
  },
  {
    city: "Doma Agricultural Axis",
    status: "ACTIVE SERVICE ZONE",
    landmarks: "Doma Central Market, Farmland Motor Parks",
    tripsDaily: "900+ Daily Rides",
    badge: "Cargo & Produce",
  },
];

export default function PublicHomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-amber-500 text-slate-950 px-4 py-2 text-center text-xs font-bold tracking-wide flex items-center justify-center space-x-2 shadow-md">
        <Sparkles className="w-3.5 h-3.5" />
        <span>KekeGO Live in Nasarawa State — Official Commercial Tricycle Hailing Platform</span>
        <span className="hidden md:inline">•</span>
        <Link href="/become-a-driver" className="underline hover:text-white transition hidden md:inline">
          Drive & Earn 80% Net Daily
        </Link>
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
              K
            </div>
            <div>
              <div className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
                <span>KekeGO</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Nasarawa
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Smart Commercial Tricycle Network</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-300">
            <Link href="/how-it-works" className="hover:text-amber-400 transition">
              How It Works
            </Link>
            <Link href="/become-a-driver" className="hover:text-amber-400 transition">
              Become a Driver
            </Link>
            <a href="#coverage" className="hover:text-amber-400 transition">
              Coverage Areas
            </a>
            <a href="#safety" className="hover:text-amber-400 transition">
              Safety & Security
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/80 text-xs font-bold text-slate-200 transition"
            >
              Sign In
            </Link>
            <Link
              href="/passenger"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/25 transition transform active:scale-95 flex items-center space-x-1.5"
            >
              <span>Book a Keke</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 overflow-hidden border-b border-slate-900">
        {/* Background Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Operating in Lafia, Keffi, Karu, Akwanga & Doma</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Smart, Safe & Reliable <span className="text-amber-400">Tricycle Hailing</span> for Nasarawa
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              No more haggling by the roadside. Experience upfront fares, verified Bajaj & TVS keke drivers, 
              4-digit security start OTPs, and instant dispatch right from your phone.
            </p>

            {/* Hero CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/passenger"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/30 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
              >
                <span>Book a Ride (Web App)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/become-a-driver"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold text-sm transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
              >
                <Car className="w-4 h-4 text-amber-400" />
                <span>Drive & Earn With KekeGO</span>
              </Link>
            </div>

            {/* Trust Highlights */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
                <h4 className="text-xs font-bold text-white">100% Verified Drivers</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Municipal permits, NIN & guarantor checked</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <Lock className="w-5 h-5 text-amber-400 mb-2" />
                <h4 className="text-xs font-bold text-white">4-Digit Security OTP</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Trip cannot start until you share code</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <TrendingUp className="w-5 h-5 text-blue-400 mb-2" />
                <h4 className="text-xs font-bold text-white">Fair Regulated Rates</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Transparent base, distance & time pricing</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <Smartphone className="w-5 h-5 text-purple-400 mb-2" />
                <h4 className="text-xs font-bold text-white">Cash or Digital Wallet</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Pay driver exact cash or debited wallet</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-900/40 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Step-by-Step Experience</span>
            <h2 className="text-3xl font-black text-white">How KekeGO Works in 4 Steps</h2>
            <p className="text-sm text-slate-400">
              Designed for daily commuters, university students, and market traders across Nasarawa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-lg">
                1
              </div>
              <h3 className="text-base font-bold text-white">Set Your Route</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your pickup and destination in Lafia, Keffi, or Karu with real Google Maps autocomplete.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-lg">
                2
              </div>
              <h3 className="text-base font-bold text-white">Choose Your Tier</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pick <strong>Standard Keke</strong> (shared), <strong>Charter</strong> (direct exclusive), or <strong>Cargo</strong> for market produce.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-lg">
                3
              </div>
              <h3 className="text-base font-bold text-white">Verify With OTP</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When your tricycle arrives, verify the driver&apos;s plate and give them your 4-digit security code.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 relative">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-lg">
                4
              </div>
              <h3 className="text-base font-bold text-white">Arrive & Rate</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enjoy a safe ride to your destination. Pay with cash or wallet, and rate your driver 5 stars.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Areas Section */}
      <section id="coverage" className="py-20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">PostGIS Geofenced</span>
              <h2 className="text-3xl font-black text-white mt-1">Operational Coverage in Nasarawa</h2>
              <p className="text-sm text-slate-400 mt-1">
                KekeGO provides active fleet coverage across key urban commercial zones.
              </p>
            </div>

            <Link
              href="/passenger"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1.5 transition"
            >
              <span>Explore Interactive Map</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {COVERAGE_HUBS.map((hub, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 flex flex-col justify-between hover:border-amber-500/40 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {hub.badge}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">{hub.city}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{hub.landmarks}</p>
                </div>
                <div className="pt-3 border-t border-slate-800">
                  <p className="text-[11px] font-mono text-amber-400 font-bold">{hub.tripsDaily}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Driver Call to Action Banner */}
      <section className="py-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-3xl shadow-xl shadow-amber-500/10">
            🛺
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Own or Drive a Keke in Nasarawa?</h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of operators earning more every day. Keep 80% of all gross fares, receive steady passenger requests, 
            and get paid weekly directly into your Nigerian bank account.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/become-a-driver"
              className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/30 transition transform hover:-translate-y-0.5"
            >
              Learn More & Register as Driver
            </Link>
            <Link
              href="/driver/login"
              className="px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 transition"
            >
              Driver Partner Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-base">
              K
            </div>
            <div>
              <p className="font-bold text-white">KekeGO Technologies Ltd.</p>
              <p className="text-[10px] text-slate-400">Commercial Mobility Network • Nasarawa State, Nigeria</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/how-it-works" className="hover:text-amber-400 transition">
              How It Works
            </Link>
            <Link href="/become-a-driver" className="hover:text-amber-400 transition">
              Drivers
            </Link>
            <Link href="/passenger" className="hover:text-amber-400 transition">
              Passenger Portal
            </Link>
            <Link href="/admin/login" className="hover:text-amber-400 transition font-semibold text-slate-300">
              Admin Portal
            </Link>
          </div>

          <p className="text-[11px] text-slate-400">
            © 2026 KekeGO. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
