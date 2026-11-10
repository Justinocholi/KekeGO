"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { StatusChip } from "../../src/components/StatusChip";
import { EmptyState } from "../../src/components/EmptyState";
import { apiRequest } from "../../src/lib/api";
import { RefreshCw, Car } from "lucide-react";

interface VehicleRecord {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year?: number | null;
  color: string;
  type: string;
  isVerified: boolean;
  isActive: boolean;
  driverName: string;
  driverPhone: string;
  partnerName: string;
  createdAt: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<VehicleRecord[]>("/admin/vehicles");
      setVehicles(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchVehicles();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <Header
          title="Tricycle Fleet Registry"
          subtitle="Registered Bajaj, TVS, and Piaggio commercial units"
          actions={
            <button
              onClick={() => void fetchVehicles()}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs flex items-center space-x-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          }
        />

        <main className="flex-1 p-8 overflow-y-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-8 space-y-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-slate-800/60 rounded-xl" />
                ))}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No Tricycles Registered"
                  description="When drivers onboard their commercial vehicles, they will appear in this registry."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase font-semibold">
                      <th className="py-3.5 px-6">Plate Number</th>
                      <th className="py-3.5 px-6">Make & Model</th>
                      <th className="py-3.5 px-6">Color</th>
                      <th className="py-3.5 px-6">Assigned Driver</th>
                      <th className="py-3.5 px-6">Fleet Operator</th>
                      <th className="py-3.5 px-6">Inspection Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-6 font-mono font-bold text-amber-400 flex items-center space-x-2">
                          <Car className="w-4 h-4 text-slate-500" />
                          <span>{v.plateNumber}</span>
                        </td>
                        <td className="py-4 px-6 text-white font-medium">
                          {v.make} {v.model} {v.year ? `(${v.year})` : ""}
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 bg-amber-400" />
                          {v.color}
                        </td>
                        <td className="py-4 px-6 text-slate-200">
                          <div>{v.driverName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{v.driverPhone}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          {v.partnerName}
                        </td>
                        <td className="py-4 px-6">
                          <StatusChip status={v.isVerified ? "VERIFIED" : "PENDING_REVIEW"} />
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
