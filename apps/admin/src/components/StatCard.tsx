import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: "amber" | "emerald" | "slate";
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = "amber",
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="w-20 h-4 bg-slate-800 rounded"></div>
          <div className="w-8 h-8 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="w-16 h-8 bg-slate-800 rounded mb-2"></div>
        <div className="w-32 h-3 bg-slate-800 rounded"></div>
      </div>
    );
  }

  const badgeStyle =
    badgeColor === "emerald"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : badgeColor === "amber"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : "bg-slate-800 text-slate-400 border-slate-700";

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-colors rounded-2xl p-5 shadow-lg relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl lg:text-3xl font-bold text-white tracking-tight font-mono">
          {value}
        </span>
        {badge && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-400 mt-2 flex items-center">{subtitle}</p>
      )}
    </div>
  );
}
