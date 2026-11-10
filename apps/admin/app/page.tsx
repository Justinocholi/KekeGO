"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "../src/components/Sidebar";
import { Header } from "../src/components/Header";
import { StatCard } from "../src/components/StatCard";
import { StatusChip } from "../src/components/StatusChip";
import { EmptyState } from "../src/components/EmptyState";
import { apiRequest } from "../src/lib/api";
import {
  Users,
  Car,
  Navigation,
  Building2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface DashboardStats {
  users: {
    total: number;
    passengers: number;
    drivers: number;
    partners: number;
  };
  fleet: {
    totalVehicles: number;
    verifiedDrivers: number;
    onlineDrivers: number;
    pendingVerificationDrivers: number;
  };
  rides: {
    total: number;
    active: number;
    completed: number;
  };
  serviceArea: {
    activeState: string;
    status: string;
  };
}

interface RecentRide {
  id: string;
  rideNumber: string;
  passengerName: string;
  driverName: string | null;
  pickupAddress: string;
  destinationAddress: string;
  status: string;
  estimatedFareKobo: number;
  paymentMethod: string;
  requestedAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, ridesData] = await Promise.all([
          apiRequest<DashboardStats>("/admin/stats"),
          apiRequest<RecentRide[]>("/admin/rides?limit=5"),
        ]);
        setStats(statsData);
        setRecentRides(ridesData);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <Header
          title="Operations Command Center"
          subtitle="Real-time mobility telemetry for Nasarawa State, Nigeria"
        />

        <main className="flex-1 p-8 overflow-y-auto space-y-8">
          {/* Territory Alert Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-emerald-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Geofence Active: Nasarawa State Territory
                </h4>
                <p className="text-xs text-slate-400">
                  Strict backend point-in-polygon validation enforced for all passenger bookings & driver GPS streams.
                </p>
              </div>
            </div>
            {stats && stats.fleet.pendingVerificationDrivers > 0 && (
              <Link
                href="/drivers?status=PENDING_REVIEW"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs flex items-center space-x-1.5 transition"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{stats.fleet.pendingVerificationDrivers} Pending Driver Reviews</span>
              </Link>
            )}
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Active Trips"
              value={stats ? stats.rides.active : 0}
              subtitle="En-route & dispatching"
              icon={Navigation}
              badge={stats && stats.rides.active > 0 ? "LIVE" : "IDLE"}
              badgeColor={stats && stats.rides.active > 0 ? "emerald" : "slate"}
              loading={loading}
            />
            <StatCard
              title="Online Tricycles"
              value={stats ? stats.fleet.onlineDrivers : 0}
              subtitle={`${stats?.fleet.verifiedDrivers || 0} total verified drivers`}
              icon={Car}
              badgeColor="emerald"
              loading={loading}
            />
            <StatCard
              title="Registered Users"
              value={stats ? stats.users.total : 0}
              subtitle={`${stats?.users.passengers || 0} passengers, ${stats?.users.drivers || 0} drivers`}
              icon={Users}
              loading={loading}
            />
            <StatCard
              title="Fleet Partners"
              value={stats ? stats.users.partners : 0}
              subtitle={`${stats?.fleet.totalVehicles || 0} registered tricycles`}
              icon={Building2}
              loading={loading}
            />
          </div>

          {/* Recent Trips Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Recent Dispatch Activity
                </h3>
                <p className="text-xs text-slate-400">
                  Trips booked across Lafia, Karu, and Keffi zones
                </p>
              </div>
              <Link
                href="/rides"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1 transition"
              >
                <span>View All Rides</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-slate-800/60 rounded-xl" />
                  ))}
                </div>
              ) : recentRides.length === 0 ? (
                <EmptyState
                  title="No Trips Recorded Yet"
                  description="Ride requests and dispatch activity will appear here in real-time as passengers hail tricycles."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                        <th className="pb-3">Ride ID</th>
                        <th className="pb-3">Passenger</th>
                        <th className="pb-3">Driver</th>
                        <th className="pb-3">Pickup & Dropoff</th>
                        <th className="pb-3">Fare</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {recentRides.map((ride) => (
                        <tr key={ride.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 font-mono font-medium text-slate-300">
                            {ride.rideNumber}
                          </td>
                          <td className="py-3 font-semibold text-white">
                            {ride.passengerName}
                          </td>
                          <td className="py-3 text-slate-300">
                            {ride.driverName || (
                              <span className="text-slate-400 italic">Searching...</span>
                            )}
                          </td>
                          <td className="py-3 text-slate-400">
                            <span className="text-slate-300">{ride.pickupAddress}</span>
                            <span className="text-slate-400 mx-1.5">→</span>
                            <span className="text-slate-300">{ride.destinationAddress}</span>
                          </td>
                          <td className="py-3 font-mono text-emerald-400 font-medium">
                            ₦{(ride.estimatedFareKobo / 100).toLocaleString()}
                          </td>
                          <td className="py-3">
                            <StatusChip status={ride.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
