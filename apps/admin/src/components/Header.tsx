"use client";

import React from "react";
import { ShieldCheck, Activity } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-8">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-4">
        {/* Territory Status Chip */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-400">Launch State:</span>
          <span className="font-semibold text-slate-200">Nasarawa</span>
        </div>

        {/* Security Role Pill */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{user?.role || "ADMIN"}</span>
        </div>

        {actions}
      </div>
    </header>
  );
}
