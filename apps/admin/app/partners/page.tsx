"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { StatusChip } from "../../src/components/StatusChip";
import { EmptyState } from "../../src/components/EmptyState";
import { apiRequest } from "../../src/lib/api";
import { RefreshCw, Building2 } from "lucide-react";

interface PartnerRecord {
  id: string;
  name: string;
  companyRegistrationNumber: string | null;
  contactEmail: string;
  contactPhone: string;
  city: string | null;
  state: string;
  commissionRatePercent: number;
  isActive: boolean;
  totalDrivers: number;
  totalVehicles: number;
  createdAt: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<PartnerRecord[]>("/admin/partners");
      setPartners(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load partners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPartners();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <Header
          title="Fleet Partners & Operators"
          subtitle="Multi-tenant commercial fleet management and commission agreements"
          actions={
            <button
              onClick={() => void fetchPartners()}
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
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 bg-slate-800/60 rounded-xl" />
                ))}
              </div>
            ) : partners.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No Fleet Partners Registered"
                  description="When independent tricycle fleets join Kekego, they will be listed here with tenant isolation."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase font-semibold">
                      <th className="py-3.5 px-6">Company / Partner</th>
                      <th className="py-3.5 px-6">Reg. Number</th>
                      <th className="py-3.5 px-6">Contact Info</th>
                      <th className="py-3.5 px-6">Base Location</th>
                      <th className="py-3.5 px-6">Fleet Scale</th>
                      <th className="py-3.5 px-6">Revenue Share</th>
                      <th className="py-3.5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {partners.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-6 font-semibold text-white flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <span>{p.name}</span>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-300">
                          {p.companyRegistrationNumber || "N/A"}
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          <div>{p.contactPhone}</div>
                          <div className="text-[11px] text-slate-400">{p.contactEmail}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          {p.city ? `${p.city}, ${p.state}` : p.state}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono text-slate-200 font-bold">
                            {p.totalDrivers} drivers
                          </span>
                          <span className="text-slate-400 mx-1.5">•</span>
                          <span className="font-mono text-amber-400 font-medium">
                            {p.totalVehicles} kekes
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono text-emerald-400 font-medium">
                          {p.commissionRatePercent.toFixed(1)}%
                        </td>
                        <td className="py-4 px-6">
                          <StatusChip status={p.isActive ? "VERIFIED" : "SUSPENDED"} />
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
