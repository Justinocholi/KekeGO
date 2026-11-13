"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { useAuth } from "../../src/context/AuthContext";
import {
  Car,
  Power,
  MapPin,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Phone,
  Navigation,
} from "lucide-react";

export default function DriverCockpitPage() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  // Dispatch offer state
  const [dispatchState, setDispatchState] = useState<
    "WAITING" | "OFFER_RECEIVED" | "ACCEPTED" | "ARRIVED" | "IN_TRIP" | "COMPLETED"
  >("WAITING");
  const [countdown, setCountdown] = useState(15);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [cashConfirmed, setCashConfirmed] = useState(false);

  // Daily earnings state
  const [todayEarnings, setTodayEarnings] = useState({
    tripsCount: 14,
    grossFareKobo: 1850000, // ₦18,500
    platformFeeKobo: 277500, // ₦2,775 (15%)
    partnerFeeKobo: 92500, // ₦925 (5%)
    netEarningsKobo: 1480000, // ₦14,800 (80%)
    walletBalanceKobo: 2500000, // ₦25,000
  });

  // Countdown timer for incoming offer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (dispatchState === "OFFER_RECEIVED" && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (dispatchState === "OFFER_RECEIVED" && countdown === 0) {
      setDispatchState("WAITING");
    }
    return () => clearTimeout(timer);
  }, [dispatchState, countdown]);

  const handleSimulateIncomingOffer = () => {
    setCountdown(15);
    setDispatchState("OFFER_RECEIVED");
  };

  const handleAcceptOffer = () => {
    setDispatchState("ACCEPTED");
  };

  const handleDeclineOffer = () => {
    setDispatchState("WAITING");
  };

  const handleVerifyOtp = () => {
    if (otpInput === "7419" || otpInput === "1234" || otpInput.length === 4) {
      setOtpError(false);
      setDispatchState("IN_TRIP");
    } else {
      setOtpError(true);
    }
  };

  const handleCompleteTrip = () => {
    setDispatchState("COMPLETED");
    setCashConfirmed(false);
  };

  const handleConfirmCashPayment = () => {
    setCashConfirmed(true);
    // Update local driver earnings metrics
    setTodayEarnings((prev) => ({
      tripsCount: prev.tripsCount + 1,
      grossFareKobo: prev.grossFareKobo + 55000,
      platformFeeKobo: prev.platformFeeKobo + 8250,
      partnerFeeKobo: prev.partnerFeeKobo + 2750,
      netEarningsKobo: prev.netEarningsKobo + 44000,
      walletBalanceKobo: prev.walletBalanceKobo - 11000, // Debited 20% platform+partner share
    }));
  };

  const handleResetShift = () => {
    setDispatchState("WAITING");
    setOtpInput("");
    setCashConfirmed(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Header
          title="Driver Ride Cockpit (Driver / Rider Portal)"
          subtitle="Manage active shifts, accept dispatch calls, verify start OTPs, and track daily cash earnings"
        />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Driver Status Banner */}
          <div className="bg-gradient-to-r from-emerald-500/20 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
                {user ? user.firstName[0] : "M"}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-white">
                    {user ? `${user.firstName} ${user.lastName}` : "Musa Ibrahim"}
                  </h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Verified Driver
                  </span>
                  <span className="text-xs text-amber-400 font-bold">4.95 ★</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vehicle: <strong className="text-slate-200">Bajaj RE 4S (Yellow)</strong> • Plate:{" "}
                  <span className="font-mono text-emerald-400 font-bold">LAF-882-XA</span> • Fleet:{" "}
                  <span className="text-slate-300">Karu Transit Ltd</span>
                </p>
              </div>
            </div>

            {/* Shift Online/Offline Toggle */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Shift Status</p>
                <p className={`text-xs font-bold ${isOnline ? "text-emerald-400" : "text-rose-400"}`}>
                  {isOnline ? "ONLINE — Accepting Dispatches" : "OFFLINE — Shift Paused"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all shadow-lg ${
                  isOnline
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/20"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                <Power className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Live Dispatch Offer & Active Trip Execution */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Navigation className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Dispatch Console</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Socket.io Telemetry Active</span>
                </div>

                {/* State: WAITING */}
                {dispatchState === "WAITING" && (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                      <Car className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {isOnline ? "Waiting for Nearby Trip Dispatches..." : "Shift is Currently Offline"}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        {isOnline
                          ? "Your tricycle is broadcasting GPS coordinates along Lafia Central Market & NSUK Corridor."
                          : "Toggle your shift online to start receiving ride dispatch notifications."}
                      </p>
                    </div>

                    {isOnline && (
                      <button
                        type="button"
                        onClick={handleSimulateIncomingOffer}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center space-x-2 mx-auto shadow-lg shadow-emerald-500/20 transition"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Simulate Incoming Passenger Request</span>
                      </button>
                    )}
                  </div>
                )}

                {/* State: OFFER_RECEIVED (15s countdown) */}
                {dispatchState === "OFFER_RECEIVED" && (
                  <div className="p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500 space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>New Trip Dispatch Offer!</span>
                      </span>
                      <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-mono font-bold text-sm flex items-center justify-center shadow-lg">
                        {countdown}s
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-400">Passenger</p>
                        <p className="text-xs font-bold text-white mt-0.5">Amina Yusuf (5.0 ★)</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Total Fare (Cash)</p>
                        <p className="text-xs font-bold text-emerald-400 mt-0.5">₦550.00 NGN</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Pickup</p>
                        <p className="text-xs font-medium text-slate-300 mt-0.5 truncate">Lafia Central Market</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Destination</p>
                        <p className="text-xs font-medium text-slate-300 mt-0.5 truncate">Federal University Lafia</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleDeclineOffer}
                        className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={handleAcceptOffer}
                        className="py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition"
                      >
                        <span>Accept Dispatch ({countdown}s)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* State: ACCEPTED / ARRIVED / IN_TRIP */}
                {(dispatchState === "ACCEPTED" || dispatchState === "ARRIVED" || dispatchState === "IN_TRIP") && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400">Current Trip Passenger</p>
                        <h4 className="text-xs font-bold text-white mt-0.5">Amina Yusuf • ₦550 Cash</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Lafia Central Market ➔ Federal Univ. Lafia
                        </p>
                      </div>
                      <a
                        href="tel:+2348033333333"
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800 transition"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Step 1: En Route to Pickup */}
                    {dispatchState === "ACCEPTED" && (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-300 flex items-center space-x-2">
                          <MapPin className="w-4 h-4 shrink-0 text-sky-400" />
                          <span>Head to passenger pickup: Lafia Central Market (Est: 4 mins).</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDispatchState("ARRIVED")}
                          className="w-full py-3 bg-sky-500 hover:bg-sky-600 font-bold text-slate-950 rounded-xl text-xs shadow-lg transition"
                        >
                          I Have Arrived at Pickup Point
                        </button>
                      </div>
                    )}

                    {/* Step 2: Arrived, Verify Start OTP */}
                    {dispatchState === "ARRIVED" && (
                      <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-5 h-5 text-amber-400" />
                          <div>
                            <h5 className="text-xs font-bold text-white">Boarding Security Verification</h5>
                            <p className="text-[11px] text-slate-400">Ask the passenger for their 4-digit start code</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 pt-2">
                          <input
                            type="text"
                            maxLength={4}
                            value={otpInput}
                            onChange={(e) => {
                              setOtpInput(e.target.value);
                              setOtpError(false);
                            }}
                            placeholder="Enter 4-digit OTP (e.g. 7419)"
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 rounded-xl text-xs shadow-md transition"
                          >
                            Verify & Start Trip
                          </button>
                        </div>

                        {otpError && (
                          <p className="text-[11px] text-rose-400 flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Invalid code. For demo, enter 7419 or 1234.</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Step 3: Trip In Progress */}
                    {dispatchState === "IN_TRIP" && (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                          <span>Trip In Progress ➔ Heading to Federal University Lafia (Main Gate).</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCompleteTrip}
                          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 rounded-xl text-xs shadow-lg transition"
                        >
                          Complete Trip & Arrive at Destination
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* State: COMPLETED (Cash Collection) */}
                {dispatchState === "COMPLETED" && (
                  <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-purple-400" />
                      <h4 className="text-xs font-bold text-white">Trip Reached Destination!</h4>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Fare to Collect:</span>
                        <span className="font-bold text-white text-sm">₦550.00 NGN</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Platform Commission (15%):</span>
                        <span className="text-rose-400">-₦82.50</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Fleet Partner Share (5%):</span>
                        <span className="text-rose-400">-₦27.50</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-800">
                        <span>Driver Net Take-Home (80%):</span>
                        <span>+₦440.00 NGN</span>
                      </div>
                    </div>

                    {!cashConfirmed ? (
                      <button
                        type="button"
                        onClick={handleConfirmCashPayment}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg transition"
                      >
                        <Banknote className="w-4 h-4" />
                        <span>Confirm ₦550 Cash Received in Hand</span>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs font-medium text-center">
                          ✓ Cash Confirmed! ₦110 platform receivables debited from digital wallet.
                        </div>
                        <button
                          type="button"
                          onClick={handleResetShift}
                          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition"
                        >
                          Return to Online Standby
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Driver Wallet & Earnings Summary */}
            <div className="lg:col-span-5 space-y-6">
              {/* Daily Shift Earnings Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    <span>Today&apos;s Shift Financials</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Nasarawa Corridor</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Trips</p>
                    <p className="text-lg font-bold text-white mt-0.5">{todayEarnings.tripsCount}</p>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Net Take-Home</p>
                    <p className="text-lg font-bold text-emerald-400 mt-0.5">
                      ₦{(todayEarnings.netEarningsKobo / 100).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  <div className="flex justify-between text-slate-400">
                    <span>Gross Cash Collected:</span>
                    <span className="text-white font-semibold">
                      ₦{(todayEarnings.grossFareKobo / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Platform Commission (15%):</span>
                    <span className="text-rose-400">
                      -₦{(todayEarnings.platformFeeKobo / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Fleet Partner Share (5%):</span>
                    <span className="text-rose-400">
                      -₦{(todayEarnings.partnerFeeKobo / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                    <span>Driver Digital Wallet:</span>
                    <span className="text-emerald-400 font-bold">
                      ₦{(todayEarnings.walletBalanceKobo / 100).toLocaleString()} NGN
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Driver Credit Limit:</span>
                  </div>
                  <span className="font-mono text-slate-300">₦5,000.00</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
