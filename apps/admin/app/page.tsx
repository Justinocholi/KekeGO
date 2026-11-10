import React from "react";
import { BRAND_COLORS } from "@kekego/shared";

export default function AdminHomePage() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-950 text-xl"
            style={{ backgroundColor: BRAND_COLORS.primary.DEFAULT }}
          >
            K
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Kekego Ops</h1>
            <p className="text-xs text-slate-400">Nasarawa State Operations Portal</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Environment</span>
              <span className="font-mono text-emerald-400 font-medium">Ready</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-400">API Health</span>
              <span className="font-mono text-amber-400 font-medium">Configured</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-400">Default Territory</span>
              <span className="font-mono text-slate-200">Nasarawa, NG</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center leading-relaxed">
            Admin foundation established. Full dashboard modules, authentication, and dispatch telemetry initialize in subsequent phases.
          </p>
        </div>
      </div>
    </main>
  );
}
