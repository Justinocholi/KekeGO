"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { apiRequest } from "../../src/lib/api";
import {
  Plus,
  RefreshCw,
  Calculator,
  ShieldCheck,
} from "lucide-react";

interface FareRuleRecord {
  id: string;
  serviceAreaId?: string | null;
  tier: "STANDARD" | "CHARTER" | "CARGO";
  baseFareKobo: number;
  distanceFarePerKmKobo: number;
  timeFarePerMinKobo: number;
  minimumFareKobo: number;
  cancellationFeeKobo: number;
  platformCommissionPercent: number;
  partnerCommissionPercent: number;
  surgeMultiplier: number;
  isActive: boolean;
  version: number;
}

export default function PricingPage() {
  const [fareRules, setFareRules] = useState<FareRuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Simulator State
  const [simTier, setSimTier] = useState<"STANDARD" | "CHARTER" | "CARGO">("STANDARD");
  const [simDistanceKm, setSimDistanceKm] = useState<number>(5);
  const [simDurationMin, setSimDurationMin] = useState<number>(15);

  // Form State for New / Updated Rule
  const [formTier, setFormTier] = useState<"STANDARD" | "CHARTER" | "CARGO">("STANDARD");
  const [formBaseFareNaira, setFormBaseFareNaira] = useState<number>(200);
  const [formDistancePerKmNaira, setFormDistancePerKmNaira] = useState<number>(70);
  const [formTimePerMinNaira, setFormTimePerMinNaira] = useState<number>(15);
  const [formMinFareNaira, setFormMinFareNaira] = useState<number>(250);
  const [formCancelFeeNaira, setFormCancelFeeNaira] = useState<number>(100);
  const [formPlatformCommission, setFormPlatformCommission] = useState<number>(15);
  const [formPartnerCommission, setFormPartnerCommission] = useState<number>(5);

  const fetchFareRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<FareRuleRecord[]>("/admin/fare-rules");
      if (Array.isArray(data)) {
        setFareRules(data);
      }
    } catch {
      // Fallback: maintain current data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFareRules();
  }, [fetchFareRules]);

  const activeRules = fareRules.filter((r) => r.isActive);
  const activeRuleForSim =
    activeRules.find((r) => r.tier === simTier) ||
    fareRules.find((r) => r.tier === simTier);

  // Calculate live simulation metrics
  const simBaseKobo = activeRuleForSim ? activeRuleForSim.baseFareKobo : 20000;
  const simDistKobo = activeRuleForSim
    ? Math.round(simDistanceKm * activeRuleForSim.distanceFarePerKmKobo)
    : Math.round(simDistanceKm * 7000);
  const simTimeKobo = activeRuleForSim
    ? Math.round(simDurationMin * activeRuleForSim.timeFarePerMinKobo)
    : Math.round(simDurationMin * 1500);
  const simSubtotalKobo = simBaseKobo + simDistKobo + simTimeKobo;
  const simMinKobo = activeRuleForSim ? activeRuleForSim.minimumFareKobo : 25000;
  const simTotalKobo = Math.max(simMinKobo, simSubtotalKobo);
  const simPlatformCommissionKobo = Math.round(simTotalKobo * 0.15);
  const simPartnerCommissionKobo = Math.round(simTotalKobo * 0.05);
  const simDriverNetKobo =
    simTotalKobo - simPlatformCommissionKobo - simPartnerCommissionKobo;

  const openEditModal = (rule: FareRuleRecord) => {
    setFormTier(rule.tier);
    setFormBaseFareNaira(rule.baseFareKobo / 100);
    setFormDistancePerKmNaira(rule.distanceFarePerKmKobo / 100);
    setFormTimePerMinNaira(rule.timeFarePerMinKobo / 100);
    setFormMinFareNaira(rule.minimumFareKobo / 100);
    setFormCancelFeeNaira(rule.cancellationFeeKobo / 100);
    setFormPlatformCommission(rule.platformCommissionPercent);
    setFormPartnerCommission(rule.partnerCommissionPercent);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      await apiRequest("/admin/fare-rules", {
        method: "POST",
        body: JSON.stringify({
          tier: formTier,
          baseFareKobo: Math.round(formBaseFareNaira * 100),
          distanceFarePerKmKobo: Math.round(formDistancePerKmNaira * 100),
          timeFarePerMinKobo: Math.round(formTimePerMinNaira * 100),
          minimumFareKobo: Math.round(formMinFareNaira * 100),
          cancellationFeeKobo: Math.round(formCancelFeeNaira * 100),
          platformCommissionPercent: formPlatformCommission,
          partnerCommissionPercent: formPartnerCommission,
          surgeMultiplier: 1.0, // Fixed surge disabled guardrail
        }),
      });

      setShowModal(false);
      await fetchFareRules();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to deploy new pricing rule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <Header
          title="Fare Engine & Pricing Administration"
          subtitle="Configure baseline fares, distance/time rates, and commission splits with auditable version history"
          actions={
            <div className="flex items-center space-x-3">
              <button
                onClick={() => void fetchFareRules()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => {
                  setErrorMsg(null);
                  setShowModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-amber-500/10 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Deploy Pricing Rule</span>
              </button>
            </div>
          }
        />

        <main className="flex-1 p-8 overflow-y-auto space-y-8">
          {/* Active Pricing Cards by Ride Tier */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Active Ride Category Pricing
                </h2>
                <p className="text-xs text-slate-400">
                  Authoritative fare rates currently enforced across Nasarawa State
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Surge Pricing Disabled (1.00x MVP Scope)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  tier: "STANDARD",
                  name: "Standard Keke",
                  desc: "Urban commuter hailing (1-3 passengers)",
                  badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
                },
                {
                  tier: "CHARTER",
                  name: "Keke Charter",
                  desc: "Direct exclusive route & FCT border corridor",
                  badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/30",
                },
                {
                  tier: "CARGO",
                  name: "Keke Cargo",
                  desc: "Heavy market goods & parcel delivery",
                  badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
                },
              ].map((cat) => {
                const rule = activeRules.find((r) => r.tier === cat.tier);

                return (
                  <div
                    key={cat.tier}
                    className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-semibold ${cat.badgeColor}`}
                        >
                          {cat.tier}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          v{rule?.version || 1}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-slate-400">{cat.desc}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-800/80">
                        <div>
                          <div className="text-slate-400 text-[11px]">Base Fare</div>
                          <div className="font-bold text-white font-mono">
                            ₦{rule ? (rule.baseFareKobo / 100).toLocaleString() : "200"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[11px]">Min Fare</div>
                          <div className="font-bold text-white font-mono">
                            ₦{rule ? (rule.minimumFareKobo / 100).toLocaleString() : "250"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[11px]">Per Km</div>
                          <div className="font-bold text-white font-mono">
                            ₦{rule ? (rule.distanceFarePerKmKobo / 100).toLocaleString() : "70"}/km
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[11px]">Per Minute</div>
                          <div className="font-bold text-white font-mono">
                            ₦{rule ? (rule.timeFarePerMinKobo / 100).toLocaleString() : "15"}/min
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5 text-[11px]">
                        <div className="flex justify-between text-slate-300">
                          <span>Platform Fee:</span>
                          <span className="font-bold font-mono text-amber-400">
                            {rule ? rule.platformCommissionPercent : 15}%
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Fleet Partner Share:</span>
                          <span className="font-bold font-mono text-teal-400">
                            {rule ? rule.partnerCommissionPercent : 5}%
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Cancellation Fee:</span>
                          <span className="font-bold font-mono text-slate-200">
                            ₦{rule ? (rule.cancellationFeeKobo / 100).toLocaleString() : "100"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => rule && openEditModal(rule)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      Update {cat.name} Pricing
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Interactive Live Fare Calculator & Revenue Simulator */}
          <section className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 space-y-5">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Deterministic Fare Engine Simulator
                </h3>
                <p className="text-xs text-slate-400">
                  Preview exact kobo-calculated passenger fares and payout splits before publishing new rules
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Controls */}
              <div className="space-y-4 lg:col-span-1">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Ride Category
                  </label>
                  <select
                    value={simTier}
                    onChange={(e) => setSimTier(e.target.value as "STANDARD" | "CHARTER" | "CARGO")}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="STANDARD">Standard Keke</option>
                    <option value="CHARTER">Keke Charter</option>
                    <option value="CARGO">Keke Cargo</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider">
                      Trip Distance
                    </span>
                    <span className="font-mono text-white font-bold">{simDistanceKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="30"
                    step="0.5"
                    value={simDistanceKm}
                    onChange={(e) => setSimDistanceKm(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider">
                      Trip Duration
                    </span>
                    <span className="font-mono text-white font-bold">{simDurationMin} mins</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={simDurationMin}
                    onChange={(e) => setSimDurationMin(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Formula Step-by-Step Breakdown */}
              <div className="lg:col-span-2 p-5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-800 text-xs">
                  <div>
                    <div className="text-slate-400">Base Fare</div>
                    <div className="font-mono font-bold text-white text-sm mt-0.5">
                      ₦{(simBaseKobo / 100).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Distance ({simDistanceKm}km)</div>
                    <div className="font-mono font-bold text-white text-sm mt-0.5">
                      ₦{(simDistKobo / 100).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Time ({simDurationMin}m)</div>
                    <div className="font-mono font-bold text-white text-sm mt-0.5">
                      ₦{(simTimeKobo / 100).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Min Clamp</div>
                    <div className="font-mono font-bold text-white text-sm mt-0.5">
                      ₦{(simMinKobo / 100).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Final Total and Splits */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      Total Passenger Fare
                    </div>
                    <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                      ₦{(simTotalKobo / 100).toLocaleString()}
                    </div>
                    {simSubtotalKobo < simMinKobo && (
                      <div className="text-[10px] text-amber-300 font-mono mt-0.5">
                        * Clamped to ₦{(simMinKobo / 100).toLocaleString()} minimum fare threshold
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                      <div className="text-slate-400 text-[10px]">Platform (15%)</div>
                      <div className="font-mono font-bold text-amber-400">
                        ₦{(simPlatformCommissionKobo / 100).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                      <div className="text-slate-400 text-[10px]">Partner (5%)</div>
                      <div className="font-mono font-bold text-teal-400">
                        ₦{(simPartnerCommissionKobo / 100).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                      <div className="text-emerald-400 text-[10px]">Driver Net (80%)</div>
                      <div className="font-mono font-bold text-emerald-400">
                        ₦{(simDriverNetKobo / 100).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Version History & Audit Trail */}
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Auditable Version History Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Immutable records of past and active fare rule revisions for compliance and financial audit
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Base Fare</th>
                    <th className="py-3 px-4">Per Km</th>
                    <th className="py-3 px-4">Per Min</th>
                    <th className="py-3 px-4">Min Fare</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {fareRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="hover:bg-slate-800/30 transition text-slate-300"
                    >
                      <td className="py-3 px-4 font-bold text-white">
                        {rule.tier}
                      </td>
                      <td className="py-3 px-4 text-amber-400">
                        v{rule.version}
                      </td>
                      <td className="py-3 px-4">
                        ₦{(rule.baseFareKobo / 100).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        ₦{(rule.distanceFarePerKmKobo / 100).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        ₦{(rule.timeFarePerMinKobo / 100).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        ₦{(rule.minimumFareKobo / 100).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {rule.platformCommissionPercent}% / {rule.partnerCommissionPercent}%
                      </td>
                      <td className="py-3 px-4 font-sans">
                        {rule.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                            SUPERSEDED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {fareRules.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                        No fare rules recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Deploy / Update Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  Deploy Pricing Revision
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Publishing creates a new version. Existing trip history remains immutable.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Ride Category Tier
                </label>
                <select
                  value={formTier}
                  onChange={(e) => setFormTier(e.target.value as "STANDARD" | "CHARTER" | "CARGO")}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="STANDARD">Standard Keke</option>
                  <option value="CHARTER">Keke Charter</option>
                  <option value="CARGO">Keke Cargo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Base Fare (₦ Naira)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={formBaseFareNaira}
                    onChange={(e) => setFormBaseFareNaira(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Minimum Fare (₦ Naira)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={formMinFareNaira}
                    onChange={(e) => setFormMinFareNaira(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Per Km Rate (₦ Naira/km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    required
                    value={formDistancePerKmNaira}
                    onChange={(e) => setFormDistancePerKmNaira(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Per Minute Rate (₦ Naira/min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formTimePerMinNaira}
                    onChange={(e) => setFormTimePerMinNaira(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Cancellation Fee (₦ Naira)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={formCancelFeeNaira}
                    onChange={(e) => setFormCancelFeeNaira(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Platform Fee (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    required
                    value={formPlatformCommission}
                    onChange={(e) => setFormPlatformCommission(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Surge multiplier is locked at 1.00x in accordance with Nasarawa state regulatory policy.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {saving ? "Deploying..." : "Publish Version"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
