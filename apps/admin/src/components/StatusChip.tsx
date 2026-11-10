import React from "react";

export type StatusVariant =
  | "VERIFIED"
  | "PENDING_REVIEW"
  | "UNVERIFIED"
  | "REJECTED"
  | "SUSPENDED"
  | "ONLINE"
  | "OFFLINE"
  | "BUSY"
  | "COMPLETED"
  | "IN_PROGRESS"
  | "REQUESTED"
  | "CANCELLED"
  | "ADMIN"
  | "DRIVER"
  | "PASSENGER"
  | "PARTNER";

interface StatusChipProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

export function StatusChip({ status, variant, className = "" }: StatusChipProps) {
  const normalized = (variant || status).toUpperCase();

  let styles = "bg-slate-700/50 text-slate-300 border-slate-600";

  switch (normalized) {
    case "VERIFIED":
    case "ONLINE":
    case "COMPLETED":
      styles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      break;
    case "PENDING_REVIEW":
    case "REQUESTED":
    case "BUSY":
      styles = "bg-amber-500/10 text-amber-400 border-amber-500/30";
      break;
    case "REJECTED":
    case "SUSPENDED":
    case "CANCELLED":
      styles = "bg-rose-500/10 text-rose-400 border-rose-500/30";
      break;
    case "IN_PROGRESS":
      styles = "bg-sky-500/10 text-sky-400 border-sky-500/30";
      break;
    case "ADMIN":
      styles = "bg-purple-500/10 text-purple-400 border-purple-500/30";
      break;
    case "DRIVER":
      styles = "bg-teal-500/10 text-teal-400 border-teal-500/30";
      break;
    case "PARTNER":
      styles = "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
      break;
    case "OFFLINE":
    case "UNVERIFIED":
    default:
      styles = "bg-slate-800 text-slate-400 border-slate-700";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
