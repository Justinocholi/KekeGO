"use client";

import React from "react";
import { Activity, Shield, UserCheck, Car, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "@kekego/shared";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { user, switchRole } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-8">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-3">
        {/* Territory Status Chip */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-400">Territory:</span>
          <span className="font-semibold text-slate-200">Nasarawa</span>
        </div>

        {/* Global Interactive Role Switcher in Header */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <span className="hidden sm:inline text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-400 inline" />
            <span>Switch Role:</span>
          </span>

          <button
            type="button"
            onClick={() => switchRole(UserRole.PASSENGER)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
              user?.role === UserRole.PASSENGER
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Switch to Passenger / User Portal"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>User</span>
          </button>

          <button
            type="button"
            onClick={() => switchRole(UserRole.DRIVER)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
              user?.role === UserRole.DRIVER
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Switch to Driver Cockpit"
          >
            <Car className="w-3.5 h-3.5" />
            <span>Driver</span>
          </button>

          <button
            type="button"
            onClick={() => switchRole(UserRole.ADMIN)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
              user?.role === UserRole.ADMIN
                ? "bg-purple-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Switch to Super Admin Console"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {actions}
      </div>
    </header>
  );
}
