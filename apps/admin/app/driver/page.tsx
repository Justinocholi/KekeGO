"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { useAuth } from "../../src/context/AuthContext";
import {
  Car,
  Power,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Phone,
  Navigation,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function DriverCockpitPage() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  // Dispatch offer lifecycle states
  const [dispatchState, setDispatchState] = useState<
    "WAITING" | "OFFER_RECEIVED" | "ACCEPTED" | "ARRIVED" | "IN_TRIP" | "COMPLETED"
  >("WAITING");
  const [countdown, setCountdown] = useState(15);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [cashConfirmed, setCashConfirmed] = useState(false);

  // Shift financial ledger tracking
  const [todayEarnings, setTodayEarnings] = useState({
    tripsCount: 14,
    grossFareKobo: 1850000, // ₦18,500
    platformFeeKobo: 277500, // ₦2,775 (15%)
    partnerFeeKobo: 92500, // ₦925 (5%)
    netEarningsKobo: 1480000, // ₦14,800 (80%)
    walletBalanceKobo: 2500000, // ₦25,000
  });

  // Countdown timer for incoming offer (15s)
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
    setTodayEarnings((prev) => ({
      tripsCount: prev.tripsCount + 1,
      grossFareKobo: prev.grossFareKobo + 55000,
      platformFeeKobo: prev.platformFeeKobo + 8250,
      partnerFeeKobo: prev.partnerFeeKobo + 2750,
      netEarningsKobo: prev.netEarningsKobo + 44000,
      walletBalanceKobo: prev.walletBalanceKobo - 11000,
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
          title="Keke Driver Cockpit (Rider / Tricycle Operator)"
          subtitle="Manage active shift availability, respond to dispatches, verify passenger OTPs, and track shift revenue"
        />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Driver Shift Header with Online Toggle */}
          <div className="bg-gradient-to-r from-emerald-500/20 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
                🛺
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-white">
                    {user ? `${user.firstName} ${user.lastName}` : "Musa Ibrahim"}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Commercial Operator</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                  <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-amber-400 font-bold">
                    Plate: LAF-882-XA
                  </span>
                  <span>•</span>
                  <span>Bajaj RE 4S (Yellow)</span>
                  <span>•</span>
                  <span className="text-amber-400">4.9 ★ (185 trips)</span>
                </p>
              </div>
            </div>

            {/* Shift Online/Offline Toggle */}
            <div className="flex items-center space-x-3 bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsOnline(!isOnline);
                  if (isOnline) setDispatchState("WAITING");
                }}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
                  isOnline
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{isOnline ? "Online (Available)" : "Offline (Shift Ended)"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Active Cockpit Dispatch Actions */}
            <div className="lg:col-span-7 space-y-6">
              {/* State 1: Waiting for Dispatches */}
              {dispatchState === "WAITING" && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    {isOnline ? (
                      <>
                        <div className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping" />
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                          <Navigation className="w-8 h-8 animate-pulse" />
                        </div>
                      </>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-500">
                        <Power className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {isOnline ? "Listening for Passenger Requests..." : "You are currently Offline"}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      {isOnline
                        ? "Positioned at Lafia Central Market. Fastify dispatch engine will assign trips within 3.5km."
                        : "Turn on your shift availability switch to start receiving ride offers."}
                    </p>
                  </div>

                  {isOnline && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSimulateIncomingOffer}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition transform active:scale-95 flex items-center justify-center space-x-2 mx-auto"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Simulate Incoming Passenger Request</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* State 2: Incoming Dispatch Offer Card (Inspired by UberClone RidePopup) */}
              {dispatchState === "OFFER_RECEIVED" && (
                <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                  {/* Countdown Progress Bar */}
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-full transition-all duration-1000 ease-linear"
                      style={{ width: `${(countdown / 15) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Dispatch Offer Expires in {countdown}s</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Standard Keke • ₦550.00
                    </span>
                  </div>

                  {/* Passenger Card */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-base">
                        AY
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Amina Yusuf</h4>
                        <p className="text-[10px] text-slate-400">Rating: 5.0 ★ • Cash Trip</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Pickup Distance</p>
                      <p className="text-xs font-bold text-white font-mono">550m (2 mins away)</p>
                    </div>
                  </div>

                  {/* Two-Line Location Preview with Visual Timeline */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 relative pl-8 space-y-3">
                    <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-gradient-to-b from-emerald-500 to-amber-500" />
                    <div>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase">Pickup</p>
                      <p className="text-xs font-bold text-white">Lafia Central Market</p>
                      <p className="text-[10px] text-slate-400">Makurdi-Jos Road Central Gate</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-amber-400 font-bold uppercase">Destination</p>
                      <p className="text-xs font-bold text-white">Federal University of Lafia</p>
                      <p className="text-[10px] text-slate-400">Doma Road Permanent Site Gate</p>
                    </div>
                  </div>

                  {/* Financial Breakdown for Trip */}
                  <div className="flex items-center justify-between text-xs px-2 text-slate-300">
                    <span>Est. Gross Fare: <strong className="text-white">₦550</strong></span>
                    <span>15% Commission: <strong className="text-rose-400">-₦82.50</strong></span>
                    <span>Net Operator Payout: <strong className="text-emerald-400">₦440.00</strong></span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      type="button"
                      onClick={handleDeclineOffer}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold py-3.5 rounded-2xl text-xs transition border border-rose-500/20"
                    >
                      Decline Offer
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptOffer}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs shadow-xl shadow-emerald-500/25 transition transform active:scale-95 flex items-center justify-center space-x-2"
                    >
                      <span>Accept Trip (₦550)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* State 3: Heading to Pickup */}
              {dispatchState === "ACCEPTED" && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Step 1 of 3</span>
                      <h3 className="text-sm font-bold text-white mt-0.5">Heading to Pickup Location</h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      ETA: 2 Mins
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Passenger: Amina Yusuf</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Meet at: Lafia Central Market Gate 1</p>
                    </div>
                    <a
                      href="tel:+2348033333333"
                      className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition border border-amber-500/30"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDispatchState("ARRIVED")}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition"
                  >
                    I Have Arrived at Pickup Point
                  </button>
                </div>
              )}

              {/* State 4: Passenger OTP Verification (Inspired by UberClone ConfirmRidePickup) */}
              {dispatchState === "ARRIVED" && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">Step 2 of 3</span>
                      <h3 className="text-sm font-bold text-white mt-0.5">Verify Passenger Security OTP</h3>
                    </div>
                    <span className="text-xs text-slate-400">Passenger Code</span>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center space-y-4">
                    <p className="text-xs text-slate-300">
                      Ask Amina for her 4-digit ride verification code to start the trip:
                    </p>

                    <div className="flex justify-center">
                      <input
                        type="text"
                        maxLength={4}
                        value={otpInput}
                        onChange={(e) => {
                          setOtpInput(e.target.value);
                          setOtpError(false);
                        }}
                        placeholder="7 4 1 9"
                        className="w-48 text-center bg-slate-900 border-2 border-amber-500 rounded-2xl py-3 text-2xl font-mono font-black text-amber-400 tracking-widest focus:outline-none shadow-lg shadow-amber-500/10"
                      />
                    </div>

                    {otpError && (
                      <p className="text-xs text-rose-400 font-semibold flex items-center justify-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Invalid OTP. Enter the passenger&apos;s code: 7419</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-emerald-500/25 transition"
                  >
                    Verify Code & Start Trip
                  </button>
                </div>
              )}

              {/* State 5: In Trip Navigation */}
              {dispatchState === "IN_TRIP" && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-blue-400 tracking-wider">Step 3 of 3</span>
                      <h3 className="text-sm font-bold text-white mt-0.5">Trip in Progress to UniLafia</h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                      4.6 km • ~11 mins
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Destination</p>
                    <p className="text-xs font-bold text-white">Federal University of Lafia (Permanent Site)</p>
                    <p className="text-[10px] text-slate-400">Doma Road, Lafia, Nasarawa</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCompleteTrip}
                    className="w-full bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-500/20 transition"
                  >
                    Arrived at Destination • Complete Trip
                  </button>
                </div>
              )}

              {/* State 6: Completed & Cash Collection */}
              {dispatchState === "COMPLETED" && (
                <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 space-y-5 shadow-2xl text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">Trip Finished!</h3>
                    <p className="text-xs text-slate-400 mt-1">Collect Cash Payment from Passenger</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <p className="text-2xl font-bold font-mono text-emerald-400">₦550.00 NGN</p>
                    <p className="text-[10px] text-slate-400">Standard Keke Fare (Exact Cash or Transfer)</p>
                  </div>

                  {!cashConfirmed ? (
                    <button
                      type="button"
                      onClick={handleConfirmCashPayment}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-2xl text-xs shadow-xl shadow-emerald-500/25 transition"
                    >
                      Confirm ₦550.00 Cash Collected
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                        ✓ Payment confirmed and logged into driver financial ledger!
                      </div>
                      <button
                        type="button"
                        onClick={handleResetShift}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl text-xs transition"
                      >
                        Return to Available Status
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Shift Financials & Vehicle Details */}
            <div className="lg:col-span-5 space-y-6">
              {/* Daily Shift Financial Ledger */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Today&apos;s Shift Financials</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">{todayEarnings.tripsCount} Completed Trips</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Gross Fares Collected:</span>
                    <strong className="text-white font-mono">
                      ₦{(todayEarnings.grossFareKobo / 100).toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-rose-400">
                    <span>Platform Commission (15%):</span>
                    <strong className="font-mono">
                      -₦{(todayEarnings.platformFeeKobo / 100).toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-amber-400">
                    <span>Fleet Partner Share (5%):</span>
                    <strong className="font-mono">
                      -₦{(todayEarnings.partnerFeeKobo / 100).toLocaleString()}
                    </strong>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                    <span className="font-bold text-white">Net Driver Earnings (80%):</span>
                    <strong className="text-emerald-400 font-mono font-bold text-base">
                      ₦{(todayEarnings.netEarningsKobo / 100).toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between bg-slate-950 p-3 rounded-xl">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Available Payout Balance</p>
                    <p className="text-xs font-bold text-emerald-400">₦25,000.00 NGN</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert("Payout request of ₦25,000 initiated via Paystack Transfer API to Musa Ibrahim (First Bank).")}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                  >
                    Withdraw
                  </button>
                </div>
              </div>

              {/* Assigned Tricycle Details */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                  <Car className="w-4 h-4 text-amber-500" />
                  <span>Assigned Fleet Vehicle</span>
                </h3>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle Type:</span>
                    <span className="font-bold text-white">Commercial Tricycle (Keke)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Make & Model:</span>
                    <span className="font-bold text-white">Bajaj RE 4S (2023)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plate Number:</span>
                    <span className="font-bold font-mono text-amber-400">LAF-882-XA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fleet Partner:</span>
                    <span className="font-bold text-white">Karu Transit Cooperative</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Inspection Status:</span>
                    <span className="text-emerald-400 font-bold">Active & Inspected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
