"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { StatusChip } from "../../src/components/StatusChip";
import { EmptyState } from "../../src/components/EmptyState";
import { apiRequest } from "../../src/lib/api";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Star } from "lucide-react";

interface DriverRecord {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string | null;
  licenseNumber: string | null;
  verificationStatus: string;
  availabilityStatus: string;
  isOnline: boolean;
  rating: number;
  totalTrips: number;
  partner: string;
  vehicles: Array<{
    id: string;
    plateNumber: string;
    make: string;
    model: string;
    color: string;
    isVerified: boolean;
  }>;
  createdAt: string;
}

const TABS = [
  { label: "All Drivers", value: "" },
  { label: "Pending Review", value: "PENDING_REVIEW" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Suspended / Rejected", value: "SUSPENDED" },
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = selectedTab
        ? `/admin/drivers?status=${selectedTab}`
        : "/admin/drivers";
      const data = await apiRequest<DriverRecord[]>(endpoint);
      setDrivers(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load drivers:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedTab]);

  useEffect(() => {
    void fetchDrivers();
  }, [fetchDrivers]);

  const handleVerify = async (driverId: string, status: "VERIFIED" | "REJECTED" | "SUSPENDED") => {
    setActionLoadingId(driverId);
    try {
      await apiRequest(`/admin/drivers/${driverId}/verification`, {
        method: "PATCH",
        body: JSON.stringify({
          verificationStatus: status,
          reason: `Admin manual update to ${status}`,
        }),
      });
      await fetchDrivers();
    } catch (err) {
      alert(`Action failed: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <Header
          title="Driver Partner Onboarding & Fleet"
          subtitle="Identity documents, verification pipeline, and active licenses"
          actions={
            <button
              onClick={() => void fetchDrivers()}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs flex items-center space-x-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          }
        />

        <main className="flex-1 p-8 overflow-y-auto space-y-6">
          {/* Status Tabs */}
          <div className="flex space-x-2 border-b border-slate-800 pb-4">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedTab(tab.value)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedTab === tab.value
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Drivers Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-8 space-y-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-slate-800/60 rounded-xl" />
                ))}
              </div>
            ) : drivers.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No Drivers Found"
                  description="No driver partners match the selected verification filter."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase font-semibold">
                      <th className="py-3.5 px-6">Driver Name</th>
                      <th className="py-3.5 px-6">Phone & License</th>
                      <th className="py-3.5 px-6">Vehicle (Keke)</th>
                      <th className="py-3.5 px-6">Fleet Partner</th>
                      <th className="py-3.5 px-6">Rating & Trips</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {drivers.map((driver) => {
                      const isActing = actionLoadingId === driver.id;
                      const primaryVehicle = driver.vehicles[0];

                      return (
                        <tr key={driver.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-4 px-6 font-semibold text-white">
                            <div>{driver.name}</div>
                            <div className="text-[11px] text-slate-400 font-normal">
                              {driver.email || "No email"}
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-300">
                            <div>{driver.phoneNumber}</div>
                            <div className="text-[10px] text-slate-400 font-sans">
                              Lic: {driver.licenseNumber || "N/A"}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {primaryVehicle ? (
                              <div>
                                <span className="font-mono font-bold text-amber-400">
                                  {primaryVehicle.plateNumber}
                                </span>
                                <div className="text-[11px] text-slate-400">
                                  {primaryVehicle.color} {primaryVehicle.make} {primaryVehicle.model}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No tricycle</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-slate-300">
                            {driver.partner}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-1 text-amber-400 font-bold">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>{driver.rating.toFixed(2)}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {driver.totalTrips} completed trips
                            </div>
                          </td>
                          <td className="py-4 px-6 space-y-1">
                            <StatusChip status={driver.verificationStatus} />
                            {driver.isOnline && (
                              <div>
                                <StatusChip status="ONLINE" />
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            {driver.verificationStatus !== "VERIFIED" && (
                              <button
                                disabled={isActing}
                                onClick={() => handleVerify(driver.id, "VERIFIED")}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-[11px] transition inline-flex items-center space-x-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            {driver.verificationStatus !== "REJECTED" && (
                              <button
                                disabled={isActing}
                                onClick={() => handleVerify(driver.id, "REJECTED")}
                                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold rounded-lg text-[11px] transition inline-flex items-center space-x-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            )}

                            {driver.verificationStatus === "VERIFIED" && (
                              <button
                                disabled={isActing}
                                onClick={() => handleVerify(driver.id, "SUSPENDED")}
                                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold rounded-lg text-[11px] transition inline-flex items-center space-x-1"
                              >
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Suspend</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
