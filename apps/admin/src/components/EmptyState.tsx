import React from "react";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-4">
        <FolderOpen className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl text-xs transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
