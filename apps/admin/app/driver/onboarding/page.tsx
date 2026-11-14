"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../src/context/AuthContext";
import { UserRole } from "@kekego/shared";
import {
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function DriverOnboardingPage() {
  const { user, switchRole } = useAuth();
  const router = useRouter();
  const [simulating, setSimulating] = useState(false);

  const handleSimulateApproval = async () => {
    setSimulating(true);
    // Switch to approved driver profile to simulate admin approval completion
    await switchRole(UserRole.DRIVER);
    router.push("/driver");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-xl space-y-6 my-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              K
            </div>
            <span className="text-xl font-black text-white">KekeGO</span>
          </Link>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Driver Verification In Progress</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Onboarding & Approval Status</h1>
          <p className="text-xs text-slate-400">
            Welcome to KekeGO, {user ? `${user.firstName} ${user.lastName}` : "Driver"}! Review your verification milestones below.
          </p>
        </div>

        {/* Security Warning Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start space-x-3 text-xs text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">Application Under Review</p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              In accordance with Nasarawa State Ministry of Transport safety regulations, pending drivers cannot accept 
              commercial ride dispatches until licensing and vehicle roadworthiness particulars are verified.
            </p>
          </div>
        </div>

        {/* Verification Timeline Cards */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Verification Milestones
          </h3>

          <div className="space-y-4 relative pl-6">
            {/* Timeline connector bar */}
            <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-emerald-500 via-amber-500 to-slate-700" />

            {/* Step 1: Account Creation */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[8px] font-bold text-slate-950">
                ✓
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                  <span>Account & Contact Particulars</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Completed</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Phone {user?.phoneNumber || "+2348022222222"} verified for dispatch SMS & Socket telemetry.
                </p>
              </div>
            </div>

            {/* Step 2: License Review */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-slate-950 animate-pulse" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                  <span>Driver&apos;s License & NIN Review</span>
                  <span className="text-[10px] text-amber-400 font-normal">In Review (Admin)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Class E commercial rider permit submitted for municipal police & VIO clearance.
                </p>
              </div>
            </div>

            {/* Step 3: Vehicle Inspection */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-slate-700 border-2 border-slate-950" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-300">
                  Tricycle Physical Roadworthiness Inspection
                </h4>
                <p className="text-[11px] text-slate-400">
                  Registered Bajaj RE 4S (Yellow Livery). Scheduled at Lafia Municipal Inspection Depot.
                </p>
              </div>
            </div>

            {/* Step 4: Final Activation */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-slate-700 border-2 border-slate-950" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-300">
                  Fleet Activation & Dispatch Access
                </h4>
                <p className="text-[11px] text-slate-400">
                  Receive live passenger requests within 3.5km with 80% net daily take-home earnings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Fast-Track Admin Simulator */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-slate-900 to-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 text-center space-y-3 shadow-xl">
          <div className="flex items-center justify-center space-x-2 text-emerald-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>Interactive MVP Evaluation Tool</span>
          </div>
          <h3 className="text-sm font-bold text-white">Simulate Administrator Verification</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            In production, an administrator approves drivers via <code>/admin/drivers</code>. Click below to immediately approve this driver account and experience the active driver cockpit.
          </p>
          <button
            type="button"
            onClick={handleSimulateApproval}
            disabled={simulating}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition transform active:scale-95 inline-flex items-center space-x-2"
          >
            <span>{simulating ? "Activating..." : "Approve Driver & Open Live Cockpit"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="text-center space-y-2 text-xs text-slate-400">
          <Link href="/" className="text-slate-400 hover:text-white transition">
            ← Return to KekeGO Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
