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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
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
  const { user, logout } = useAuth();

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
                OPS
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
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Management
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-slate-950" : "text-slate-400"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Profile & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {user ? user.firstName[0] : "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user ? `${user.firstName} ${user.lastName}` : "Administrator"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || user?.phoneNumber || "admin@kekego.ng"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
