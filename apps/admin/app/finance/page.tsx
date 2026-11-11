"use client";

import React, { useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Building2,
  Car,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";

interface LedgerItem {
  id: string;
  category: string;
  entryType: "CREDIT" | "DEBIT";
  amountKobo: number;
  balanceAfterKobo: number;
  description: string;
  idempotencyKey: string;
  createdAt: string;
}

const INITIAL_SUMMARY = {
  grossMerchandiseValueNgn: 485250,
  platformCommissionNgn: 72787.5,
  partnerCommissionNgn: 24262.5,
  driverEarningsNgn: 388200,
  completedPaymentsCount: 142,
};

const INITIAL_LEDGER: LedgerItem[] = [
  {
    id: "led-001",
    category: "TRIP_FARE",
    entryType: "CREDIT",
    amountKobo: 62000,
    balanceAfterKobo: 245000,
    description: "Driver net earnings for electronic trip ride-d128",
    idempotencyKey: "ride:ride-d128:driver_fare",
    createdAt: "2026-11-11 02:15:30",
  },
  {
    id: "led-002",
    category: "PLATFORM_COMMISSION",
    entryType: "CREDIT",
    amountKobo: 11625,
    balanceAfterKobo: 11625,
    description: "Kekego platform commission (15%) for trip ride-d128",
    idempotencyKey: "ride:ride-d128:platform_comm",
    createdAt: "2026-11-11 02:15:30",
  },
  {
    id: "led-003",
    category: "PARTNER_COMMISSION",
    entryType: "CREDIT",
    amountKobo: 3875,
    balanceAfterKobo: 48200,
    description: "Fleet partner 5% commission for trip ride-d128",
    idempotencyKey: "ride:ride-d128:partner_comm",
    createdAt: "2026-11-11 02:15:30",
  },
  {
    id: "led-004",
    category: "PLATFORM_COMMISSION",
    entryType: "DEBIT",
    amountKobo: 3750,
    balanceAfterKobo: 233375,
    description: "Platform 15% commission receivable for cash trip ride-c091",
    idempotencyKey: "ride:ride-c091:cash_platform_comm",
    createdAt: "2026-11-11 01:54:12",
  },
  {
    id: "led-005",
    category: "WALLET_TOPUP",
    entryType: "CREDIT",
    amountKobo: 500000,
    balanceAfterKobo: 525000,
    description: "Wallet top-up via Paystack reference TOPUP_u8841_91823",
    idempotencyKey: "topup:TOPUP_u8841_91823",
    createdAt: "2026-11-11 01:30:00",
  },
  {
    id: "led-006",
    category: "PAYOUT",
    entryType: "DEBIT",
    amountKobo: 1500000,
    balanceAfterKobo: 84000,
    description: "NUBAN bank payout to 0128941209 (GTBank)",
    idempotencyKey: "payout:payout-9921",
    createdAt: "2026-11-10 23:18:45",
  },
];

export default function FinancePage() {
  const [summary] = useState(INITIAL_SUMMARY);
  const [ledger] = useState<LedgerItem[]>(INITIAL_LEDGER);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLedger = ledger.filter((item) => {
    const matchesCategory =
      selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch =
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.idempotencyKey.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Page Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Financial Ledger & Settlement
            </h1>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Immutable Double-Entry Ledger</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time reconciliation of Paystack card payments, driver cash receivables, and partner splits in Nasarawa State.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reconcile Now</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Gross Volume (GMV)
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              ₦{summary.grossMerchandiseValueNgn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              From {summary.completedPaymentsCount} verified completed trips
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Platform Revenue (15%)
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              ₦{summary.platformCommissionNgn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Kekego operational net commission
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Fleet Partners (5%)
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-400 tracking-tight">
              ₦{summary.partnerCommissionNgn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Distributed to verified fleet owners
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Driver Earnings (80%)
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-400 tracking-tight">
              ₦{summary.driverEarningsNgn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Direct driver takeaway earnings
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search description, ride, idempotency key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          {["ALL", "TRIP_FARE", "PLATFORM_COMMISSION", "PARTNER_COMMISSION", "PAYOUT", "WALLET_TOPUP"].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {cat.replace("_", " ")}
              </button>
            )
          )}
        </div>
      </div>

      {/* Immutable Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-amber-400" />
            <span>Auditable Transaction Entries</span>
          </h2>
          <span className="text-xs text-slate-400">
            Showing {filteredLedger.length} ledger movements
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Amount (NGN)</th>
                <th className="px-5 py-3.5">Balance After</th>
                <th className="px-5 py-3.5">Idempotency Key</th>
                <th className="px-5 py-3.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLedger.map((item) => (
                <tr key={item.id} className="hover:bg-slate-850/40 transition">
                  <td className="px-5 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                    {item.createdAt}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wide ${
                        item.category === "TRIP_FARE"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : item.category === "PLATFORM_COMMISSION"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : item.category === "PARTNER_COMMISSION"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : item.category === "PAYOUT"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {item.category.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {item.entryType === "CREDIT" ? (
                      <span className="flex items-center text-xs font-semibold text-emerald-400">
                        <ArrowDownLeft className="w-3.5 h-3.5 mr-1" />
                        CREDIT
                      </span>
                    ) : (
                      <span className="flex items-center text-xs font-semibold text-rose-400">
                        <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                        DEBIT
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono font-semibold text-white whitespace-nowrap">
                    ₦{(item.amountKobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                    ₦{(item.balanceAfterKobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-400 truncate max-w-xs">
                    {item.idempotencyKey}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-300 max-w-md">
                    {item.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
