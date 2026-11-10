"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { StatusChip } from "../../src/components/StatusChip";
import { EmptyState } from "../../src/components/EmptyState";
import { apiRequest } from "../../src/lib/api";
import { RefreshCw, Navigation } from "lucide-react";

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

const RIDE_STATUS_FILTERS = [
  { label: "All Rides", value: "" },
  { label: "Active Trips", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function RidesPage() {
  const [rides, setRides] = useState<RideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = selectedStatus
        ? `/admin/rides?status=${selectedStatus}`
        : "/admin/rides";
      const data = await apiRequest<RideRecord[]>(endpoint);
      setRides(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load rides:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    void fetchRides();
  }, [fetchRides]);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <Header
          title="Trip Dispatch & Operations"
          subtitle="Real-time ride logs, telemetry, and fare settlements across Nasarawa State"
          actions={
            <button
              onClick={() => void fetchRides()}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs flex items-center space-x-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          }
        />

        <main className="flex-1 p-8 overflow-y-auto space-y-6">
          {/* Status Filters */}
          <div className="flex space-x-2 border-b border-slate-800 pb-4">
            {RIDE_STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedStatus(filter.value)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedStatus === filter.value
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

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
                  description="When passengers book rides in Nasarawa State, operational details and route telemetry will appear here."
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
