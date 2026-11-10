"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { StatusChip } from "../../src/components/StatusChip";
import { EmptyState } from "../../src/components/EmptyState";
import { apiRequest } from "../../src/lib/api";
import { getAdminSocket } from "../../src/lib/socket";
import { SocketServerEvent } from "@kekego/validation";
import {
  RefreshCw,
  Navigation,
  Radio,
  Clock,
  History,
  Wifi,
} from "lucide-react";

interface RideRecord {
  id: string;
  rideNumber: string;
  tier: string;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  estimatedFareKobo: number;
  finalFareKobo?: number | null;
  paymentMethod: string;
  paymentStatus: string;
  passengerName: string;
  passengerPhone: string;
  driverName?: string | null;
  driverPhone?: string | null;
  vehiclePlate?: string | null;
  requestedAt: string;
  completedAt?: string | null;
}

interface ActiveDispatchRecord {
  rideId: string;
  rideNumber: string;
  tier: string;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  passengerName: string;
  attemptsCount: number;
  currentAttempt?: {
    driverId: string;
    dispatchedAt: string;
    expiresAt: string;
  } | null;
  requestedAt: string;
}

interface DispatchHistoryItem {
  id: string;
  rideId: string;
  driverId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  reason?: string;
  dispatchedAt: string;
  expiresAt: string;
  resolvedAt?: string;
}

const RIDE_STATUS_FILTERS = [
  { label: "All Rides", value: "" },
  { label: "Matching / Dispatching", value: "SEARCHING" },
  { label: "Driver Assigned", value: "DRIVER_ASSIGNED" },
  { label: "Active Trips", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled / No Driver", value: "CANCELLED" },
];

export default function RidesPage() {
  const [rides, setRides] = useState<RideRecord[]>([]);
  const [activeDispatches, setActiveDispatches] = useState<ActiveDispatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedHistoryRideId, setSelectedHistoryRideId] = useState<string | null>(null);
  const [dispatchHistory, setDispatchHistory] = useState<DispatchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const fetchRidesAndDispatches = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = selectedStatus
        ? `/admin/rides?status=${selectedStatus}`
        : "/admin/rides";
      const [ridesData, dispatchesData] = await Promise.allSettled([
        apiRequest<RideRecord[]>(endpoint),
        apiRequest<ActiveDispatchRecord[]>("/admin/dispatch/active"),
      ]);

      if (ridesData.status === "fulfilled" && Array.isArray(ridesData.value)) {
        setRides(ridesData.value);
      }
      if (dispatchesData.status === "fulfilled" && Array.isArray(dispatchesData.value)) {
        setActiveDispatches(dispatchesData.value);
      }
    } catch {
      // Keep existing data
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    void fetchRidesAndDispatches();
  }, [fetchRidesAndDispatches]);

  // Connect real-time admin telemetry socket
  useEffect(() => {
    const socket = getAdminSocket();
    if (!socket) return;

    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);

    if (socket.connected) {
      setIsSocketConnected(true);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    const handleTelemetry = () => {
      // Real-time automatic refresh on ride dispatch/state updates
      void fetchRidesAndDispatches();
    };

    socket.on(SocketServerEvent.ADMIN_TELEMETRY_UPDATE, handleTelemetry);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(SocketServerEvent.ADMIN_TELEMETRY_UPDATE, handleTelemetry);
    };
  }, [fetchRidesAndDispatches]);

  const viewDispatchHistory = async (rideId: string) => {
    setSelectedHistoryRideId(rideId);
    setLoadingHistory(true);
    try {
      const history = await apiRequest<DispatchHistoryItem[]>(
        `/rides/${rideId}/dispatch-history`
      );
      setDispatchHistory(Array.isArray(history) ? history : []);
    } catch {
      setDispatchHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <Header
          title="Trip Dispatch & Operations"
          subtitle="Real-time ride matching, dispatch queues, and route telemetry across Nasarawa State"
          actions={
            <div className="flex items-center space-x-2">
              <div
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                  isSocketConnected
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {isSocketConnected && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isSocketConnected ? "bg-emerald-500" : "bg-slate-500"
                    }`}
                  ></span>
                </span>
                <span className="flex items-center space-x-1">
                  <Wifi className="w-3 h-3" />
                  <span>{isSocketConnected ? "Live Telemetry" : "Connecting"}</span>
                </span>
              </div>

              <button
                onClick={() => void fetchRidesAndDispatches()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          }
        />

        <main className="flex-1 p-8 overflow-y-auto space-y-6">
          {/* Active Dispatch Radar Banner */}
          {activeDispatches.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-1.5">
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span>Live Matching Radar ({activeDispatches.length} searching)</span>
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-amber-300/80">
                  15-second driver countdown active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeDispatches.map((dispatch) => (
                  <div
                    key={dispatch.rideId}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-400">
                        {dispatch.rideNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {dispatch.tier}
                      </span>
                    </div>

                    <div className="space-y-0.5 text-slate-300">
                      <p className="truncate font-medium">{dispatch.passengerName}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        Pickup: {dispatch.pickupAddress}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Attempt #{dispatch.attemptsCount || 1}</span>
                      </span>
                      <button
                        onClick={() => void viewDispatchHistory(dispatch.rideId)}
                        className="text-amber-400 hover:underline font-semibold"
                      >
                        Inspect Queue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Filters */}
          <div className="flex space-x-2 border-b border-slate-800 pb-4 overflow-x-auto">
            {RIDE_STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedStatus(filter.value)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedStatus === filter.value
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-bold"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Rides Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-8 space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-800/60 rounded-xl" />
                ))}
              </div>
            ) : rides.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No Trips Recorded"
                  description="When passengers book rides in Nasarawa State, operational details, matching events, and route telemetry will appear here."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase font-semibold">
                      <th className="py-3.5 px-6">Ride Number</th>
                      <th className="py-3.5 px-6">Tier</th>
                      <th className="py-3.5 px-6">Passenger</th>
                      <th className="py-3.5 px-6">Driver & Vehicle</th>
                      <th className="py-3.5 px-6">Pickup & Destination</th>
                      <th className="py-3.5 px-6">Fare & Payment</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Dispatch History</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {rides.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-6 font-mono font-bold text-amber-400 flex items-center space-x-2">
                          <Navigation className="w-4 h-4 text-slate-500" />
                          <span>{r.rideNumber}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          <span className="font-semibold text-white">{r.tier}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-200">
                          <div>{r.passengerName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{r.passengerPhone}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-200">
                          {r.driverName ? (
                            <div>
                              <div>{r.driverName}</div>
                              <div className="text-[11px] font-mono text-amber-400">
                                {r.vehiclePlate || "Plate pending"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-300 max-w-xs">
                          <div className="truncate">
                            <span className="text-slate-400">From:</span> {r.pickupAddress}
                          </div>
                          <div className="truncate text-slate-400">
                            <span className="text-slate-400">To:</span> {r.destinationAddress}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-mono text-emerald-400 font-bold">
                            ₦{((r.finalFareKobo || r.estimatedFareKobo) / 100).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {r.paymentMethod} • {r.paymentStatus}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <StatusChip status={r.status} />
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => void viewDispatchHistory(r.id)}
                            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-[11px] transition"
                          >
                            <History className="w-3.5 h-3.5 text-amber-400" />
                            <span>Attempts</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Dispatch History Modal */}
      {selectedHistoryRideId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <span>Dispatch Attempts & Cascade Audit</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Ride ID: {selectedHistoryRideId}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryRideId(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {loadingHistory ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Loading dispatch attempts history...
                </div>
              ) : dispatchHistory.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                  No previous dispatch attempts recorded for this trip.
                </div>
              ) : (
                dispatchHistory.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">
                        Attempt #{idx + 1} • Driver ID: {item.driverId.slice(0, 8)}...
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.status === "ACCEPTED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : item.status === "REJECTED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : item.status === "EXPIRED"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {item.reason && (
                      <p className="text-[11px] text-rose-400 bg-rose-500/5 p-2 rounded border border-rose-500/10">
                        Reason: {item.reason}
                      </p>
                    )}

                    <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/50">
                      <span>Dispatched: {new Date(item.dispatchedAt).toLocaleTimeString()}</span>
                      <span>Expires: {new Date(item.expiresAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button
                onClick={() => setSelectedHistoryRideId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
