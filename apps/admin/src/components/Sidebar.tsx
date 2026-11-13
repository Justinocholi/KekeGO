"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  Building2,
  Navigation,
  LogOut,
  MapPin,
  Banknote,
  Wallet,
  LifeBuoy,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "@kekego/shared";

const MVP_PORTALS = [
  { label: "Passenger Portal", href: "/passenger", icon: UserCheck, role: "User / Rider", badge: "BOOKING" },
  { label: "Driver Cockpit", href: "/driver", icon: Car, role: "Driver", badge: "DISPATCH" },
  { label: "Admin Console", href: "/", icon: LayoutDashboard, role: "Super Admin", badge: "OPS" },
];

const MANAGEMENT_ITEMS = [
  { label: "Service Areas & Geo", href: "/service-areas", icon: MapPin },
  { label: "Pricing & Fares", href: "/pricing", icon: Banknote },
  { label: "Finance & Ledger", href: "/finance", icon: Wallet },
  { label: "Support & Disputes", href: "/support", icon: LifeBuoy },
  { label: "Driver Partners", href: "/drivers", icon: Car },
  { label: "Passengers & Users", href: "/users", icon: Users },
  { label: "Tricycle Fleet", href: "/vehicles", icon: Car },
  { label: "Fleet Partners", href: "/partners", icon: Building2 },
  { label: "Trips & Dispatch", href: "/rides", icon: Navigation },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, switchRole } = useAuth();

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            K
          </div>
          <div>
            <div className="text-base font-bold text-white tracking-tight flex items-center space-x-1.5">
              <span>Kekego</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                MVP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
              <MapPin className="w-3 h-3 text-emerald-400 inline" />
              <span>Nasarawa Territory</span>
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {/* MVP User & Driver Portals */}
        <div className="space-y-1">
          <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider px-3 mb-1.5 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Interactive Portals</span>
          </div>
          {MVP_PORTALS.map((portal) => {
            const Icon = portal.icon;
            const isActive = pathname === portal.href;
            return (
              <Link
                key={portal.href}
                href={portal.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-amber-400"}`} />
                  <span>{portal.label}</span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? "bg-slate-950 text-amber-400" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {portal.badge}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Back-Office Operations Management */}
        <div className="space-y-1 pt-2 border-t border-slate-900">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
            Fleet & Operations
          </div>
          {MANAGEMENT_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-amber-400 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Role Switcher & Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-2.5">
        {/* Quick Role Switch Buttons */}
        <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 grid grid-cols-3 gap-1 text-[10px] text-center font-semibold">
          <button
            type="button"
            onClick={() => switchRole(UserRole.PASSENGER)}
            className={`py-1 rounded-lg transition ${
              user?.role === UserRole.PASSENGER ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            User
          </button>
          <button
            type="button"
            onClick={() => switchRole(UserRole.DRIVER)}
            className={`py-1 rounded-lg transition ${
              user?.role === UserRole.DRIVER ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            Driver
          </button>
          <button
            type="button"
            onClick={() => switchRole(UserRole.ADMIN)}
            className={`py-1 rounded-lg transition ${
              user?.role === UserRole.ADMIN ? "bg-purple-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Admin
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {user ? user.firstName[0] : "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user ? `${user.firstName} ${user.lastName}` : "Administrator"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.role || "ADMIN"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
