"use client";

import React, { useState } from "react";
import {
  LifeBuoy,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ShieldAlert,
  MessageSquare,
  X,
  FileText,
} from "lucide-react";

interface TicketItem {
  id: string;
  ticketNumber: string;
  category: string;
  subject: string;
  description: string;
  rideId?: string | null;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT_SOS";
  resolutionNote?: string | null;
  createdAt: string;
}

const INITIAL_TICKETS: TicketItem[] = [
  {
    id: "tick-001",
    ticketNumber: "TICK-20261111-9102",
    category: "FARE_DISPUTE",
    subject: "Driver requested extra cash above app fare in Karu",
    description: "Driver claimed fuel pump price increased and requested ₦200 extra above the ₦500 app fare.",
    rideId: "ride-d812-karu",
    status: "INVESTIGATING",
    priority: "HIGH",
    createdAt: "2026-11-11 02:40:15",
  },
  {
    id: "tick-002",
    ticketNumber: "TICK-20261111-8419",
    category: "SAFETY_INCIDENT",
    subject: "Overcrowding in Standard Keke on Keffi Express",
    description: "Driver attempted to pick 4 passengers in a 3-passenger standard tricycle near Keffi junction.",
    rideId: "ride-k441-keffi",
    status: "OPEN",
    priority: "URGENT_SOS",
    createdAt: "2026-11-11 02:25:00",
  },
  {
    id: "tick-003",
    ticketNumber: "TICK-20261111-7301",
    category: "LOST_ITEM",
    subject: "Left student ID card and wallet in rear seat",
    description: "Disembarked at Federal University Lafia gate; wallet left on passenger seat.",
    rideId: "ride-l990-lafia",
    status: "RESOLVED",
    priority: "MEDIUM",
    resolutionNote: "Driver contacted via dispatch. Item handed over to university security post.",
    createdAt: "2026-11-11 01:10:20",
  },
  {
    id: "tick-004",
    ticketNumber: "TICK-20261110-6102",
    category: "ACCOUNT_ISSUE",
    subject: "Wallet top-up delay via bank transfer",
    description: "₦2,000 transfer completed but wallet balance did not update immediately.",
    rideId: null,
    status: "RESOLVED",
    priority: "LOW",
    resolutionNote: "Paystack webhook processed; balance credited with ₦2,000.",
    createdAt: "2026-11-10 21:15:00",
  },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<TicketItem[]>(INITIAL_TICKETS);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalTicket, setActiveModalTicket] = useState<TicketItem | null>(null);
  const [modalStatus, setModalStatus] = useState<"OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED">("RESOLVED");
  const [resolutionNote, setResolutionNote] = useState("");

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = () => {
    if (!activeModalTicket) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === activeModalTicket.id
          ? { ...t, status: modalStatus, resolutionNote: resolutionNote || t.resolutionNote }
          : t
      )
    );
    setActiveModalTicket(null);
    setResolutionNote("");
  };

  const openTicketsCount = tickets.filter((t) => t.status === "OPEN").length;
  const investigatingCount = tickets.filter((t) => t.status === "INVESTIGATING").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;
  const urgentCount = tickets.filter((t) => t.priority === "URGENT_SOS" && t.status !== "CLOSED").length;

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Page Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Support Tickets & Dispute Resolution
            </h1>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Customer Operations</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage passenger fare disputes, safety incidents, and lost items across Nasarawa operating zones.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Open Tickets
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">{openTicketsCount}</div>
            <p className="text-xs text-slate-400 mt-1">Awaiting operational triage</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              In Investigation
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-400 tracking-tight">{investigatingCount}</div>
            <p className="text-xs text-slate-400 mt-1">Active driver & trip reviews</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Safety / SOS Alerts
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-400 tracking-tight">{urgentCount}</div>
            <p className="text-xs text-slate-400 mt-1">High-priority safety escalations</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Resolved Tickets
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">{resolvedCount}</div>
            <p className="text-xs text-slate-400 mt-1">Successfully closed disputes</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets, subject, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          {["ALL", "OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                statusFilter === st
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Support Inquiries & Disputes</span>
          </h2>
          <span className="text-xs text-slate-400">
            Showing {filteredTickets.length} tickets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Ticket #</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Subject & Description</th>
                <th className="px-5 py-3.5">Ride Ref</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-850/40 transition">
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-amber-400 whitespace-nowrap">
                    {ticket.ticketNumber}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wide ${
                        ticket.category === "FARE_DISPUTE"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : ticket.category === "SAFETY_INCIDENT"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : ticket.category === "LOST_ITEM"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}
                    >
                      {ticket.category.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        ticket.priority === "URGENT_SOS"
                          ? "bg-rose-600 text-white animate-pulse"
                          : ticket.priority === "HIGH"
                          ? "bg-rose-500/20 text-rose-400"
                          : ticket.priority === "MEDIUM"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {ticket.priority.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                        ticket.status === "OPEN"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : ticket.status === "INVESTIGATING"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                          : ticket.status === "RESOLVED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 max-w-sm">
                    <div className="font-medium text-white text-xs truncate">{ticket.subject}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{ticket.description}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                    {ticket.rideId || "N/A"}
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        setActiveModalTicket(ticket);
                        setModalStatus(ticket.status === "RESOLVED" ? "RESOLVED" : "INVESTIGATING");
                        setResolutionNote(ticket.resolutionNote || "");
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 transition"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {activeModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Ticket #{activeModalTicket.ticketNumber}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalTicket(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400">Subject</label>
                <div className="text-sm font-semibold text-white mt-1">
                  {activeModalTicket.subject}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <div className="text-xs text-slate-300 mt-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {activeModalTicket.description}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Status Transition</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED")}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white mt-1 focus:border-amber-500 focus:outline-none"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="INVESTIGATING">INVESTIGATING</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">
                  Resolution Note / Action Taken
                </label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Explain actions taken (dispatched warning, refund processed, lost item recovered)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white mt-1 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setActiveModalTicket(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition"
              >
                Update Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
