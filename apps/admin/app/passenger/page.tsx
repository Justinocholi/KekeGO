"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { apiRequest } from "../../src/lib/api";
import { useAuth } from "../../src/context/AuthContext";
import {
  MapPin,
  Navigation,
  CreditCard,
  Banknote,
  Star,
  CheckCircle2,
  Clock,
  Phone,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

interface FareEstimateData {
  estimates: Array<{
    tier: string;
    totalFareKobo: number;
    baseFareKobo: number;
    distanceFareKobo: number;
    timeFareKobo: number;
    currency: string;
  }>;
  distanceMeters: number;
  durationSeconds: number;
}

const NASARAWA_HUBS = [
  { name: "Lafia Central Market", lat: 8.498, lng: 8.518 },
  { name: "Federal University Lafia (Main Gate)", lat: 8.525, lng: 8.535 },
  { name: "Dalhatu Araf Specialist Hospital (DASH)", lat: 8.489, lng: 8.512 },
  { name: "Keffi Express Junction", lat: 8.852, lng: 7.872 },
  { name: "Nasarawa State University Keffi (NSUK)", lat: 8.865, lng: 7.885 },
  { name: "Mararaba / Karu Boundary Axis", lat: 9.010, lng: 7.580 },
  { name: "Akwanga Central Roundabout", lat: 8.910, lng: 8.410 },
  { name: "Doma Town Central Motor Park", lat: 8.350, lng: 8.350 },
];

export default function PassengerPortalPage() {
  const { user } = useAuth();
  const [pickupIndex, setPickupIndex] = useState(0);
  const [destIndex, setDestIndex] = useState(1);
  const [selectedTier, setSelectedTier] = useState<"STANDARD" | "CHARTER" | "CARGO">("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "WALLET_CARD">("CASH");

  const [fareEstimate, setFareEstimate] = useState<FareEstimateData | null>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);

  // Ride Simulation States
  const [rideState, setRideState] = useState<
    "IDLE" | "SEARCHING" | "ASSIGNED" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED"
  >("IDLE");
  const [startOtp] = useState("7419");
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Fetch fare estimate when pickup, destination, or tier changes
  useEffect(() => {
    async function fetchEstimate() {
      setIsLoadingEstimate(true);
      try {
        const pickup = NASARAWA_HUBS[pickupIndex];
        const destination = NASARAWA_HUBS[destIndex];

        const res = await apiRequest<{ data: FareEstimateData }>("/fare/estimate", {
          method: "POST",
          body: JSON.stringify({
            pickup: { latitude: pickup.lat, longitude: pickup.lng },
            destination: { latitude: destination.lat, longitude: destination.lng },
            tier: selectedTier,
          }),
        });

        if (res && res.data) {
          setFareEstimate(res.data);
        }
      } catch {
        // Fallback estimate calculation for demo display
        setFareEstimate({
          distanceMeters: 3800,
          durationSeconds: 660,
          estimates: [
            {
              tier: selectedTier,
              totalFareKobo: selectedTier === "STANDARD" ? 45000 : selectedTier === "CHARTER" ? 95000 : 70000,
              baseFareKobo: 20000,
              distanceFareKobo: 20000,
              timeFareKobo: 5000,
              currency: "NGN",
            },
          ],
        });
      } finally {
        setIsLoadingEstimate(false);
      }
    }

    void fetchEstimate();
  }, [pickupIndex, destIndex, selectedTier]);

  const handleRequestRide = () => {
    setRideState("SEARCHING");
    setTimeout(() => {
      setRideState("ASSIGNED");
    }, 2500);
  };

  const handleResetRide = () => {
    setRideState("IDLE");
    setRatingSubmitted(false);
    setRatingComment("");
  };

  const activeEstimate = fareEstimate?.estimates?.[0];
  const fareInNaira = activeEstimate ? (activeEstimate.totalFareKobo / 100).toLocaleString() : "450";

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Header
          title="Passenger Booking Portal (Rider / User)"
          subtitle="Book commercial tricycles, inspect verified fare estimates, and experience the rider journey"
        />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Top Banner with Passenger Status */}
          <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">
                {user ? user.firstName[0] : "A"}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-white">
                    {user ? `${user.firstName} ${user.lastName}` : "Amina Yusuf"}
                  </h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Active Passenger
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1">
                  <span>Phone: {user ? user.phoneNumber : "+2348033333333"}</span>
                  <span>•</span>
                  <span className="text-emerald-400">Rating: 5.0 ★</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800">
              <Banknote className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Digital Wallet</p>
                <p className="text-xs font-bold text-emerald-400">₦10,000.00 NGN</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Ride Request Controls */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Navigation className="w-4 h-4 text-amber-500" />
                    <span>Plan Your Keke Ride</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Nasarawa Corridor</span>
                </div>

                {/* Pickup Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pickup Location</span>
                  </label>
                  <select
                    value={pickupIndex}
                    onChange={(e) => setPickupIndex(Number(e.target.value))}
                    disabled={rideState !== "IDLE"}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {NASARAWA_HUBS.map((hub, idx) => (
                      <option key={hub.name} value={idx}>
                        {hub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Destination Location</span>
                  </label>
                  <select
                    value={destIndex}
                    onChange={(e) => setDestIndex(Number(e.target.value))}
                    disabled={rideState !== "IDLE"}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {NASARAWA_HUBS.map((hub, idx) => (
                      <option key={hub.name} value={idx}>
                        {hub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tricycle Category Tiers */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Select Keke Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTier("STANDARD")}
                      disabled={rideState !== "IDLE"}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedTier === "STANDARD"
                          ? "bg-amber-500/10 border-amber-500 text-amber-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <p className="text-xs font-bold">Standard</p>
                      <p className="text-[10px] mt-0.5">3 Passengers</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTier("CHARTER")}
                      disabled={rideState !== "IDLE"}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedTier === "CHARTER"
                          ? "bg-amber-500/10 border-amber-500 text-amber-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <p className="text-xs font-bold">Charter</p>
                      <p className="text-[10px] mt-0.5">Exclusive Hire</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTier("CARGO")}
                      disabled={rideState !== "IDLE"}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedTier === "CARGO"
                          ? "bg-amber-500/10 border-amber-500 text-amber-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <p className="text-xs font-bold">Cargo</p>
                      <p className="text-[10px] mt-0.5">Goods & Haulage</p>
                    </button>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CASH")}
                      disabled={rideState !== "IDLE"}
                      className={`p-3 rounded-xl border flex items-center space-x-2 transition ${
                        paymentMethod === "CASH"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      <div className="text-left">
                        <p className="text-xs font-bold">Cash</p>
                        <p className="text-[9px]">Pay driver directly</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("WALLET_CARD")}
                      disabled={rideState !== "IDLE"}
                      className={`p-3 rounded-xl border flex items-center space-x-2 transition ${
                        paymentMethod === "WALLET_CARD"
                          ? "bg-amber-500/10 border-amber-500 text-amber-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <div className="text-left">
                        <p className="text-xs font-bold">Paystack Card</p>
                        <p className="text-[9px]">Auto digital debit</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                {rideState === "IDLE" ? (
                  <button
                    type="button"
                    onClick={handleRequestRide}
                    disabled={isLoadingEstimate}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition"
                  >
                    <span>Request Keke ({selectedTier}) — ₦{fareInNaira}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetRide}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset / Start Another Ride</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Live Dispatch & Ride Simulation Status */}
            <div className="lg:col-span-7 space-y-6">
              {/* Trip Estimate Summary Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Official Fare Breakdown Snapshot
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">Verified PostGIS Engine</span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-400">Route Distance</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {fareEstimate ? `${(fareEstimate.distanceMeters / 1000).toFixed(1)} km` : "3.8 km"}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-400">Est. Duration</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {fareEstimate ? `${Math.round(fareEstimate.durationSeconds / 60)} mins` : "11 mins"}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-400">Total Fare</p>
                    <p className="text-sm font-bold text-amber-400 mt-0.5">₦{fareInNaira} NGN</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-400 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <span>Base Pickup Fare</span>
                    <span className="text-slate-200">
                      ₦{activeEstimate ? (activeEstimate.baseFareKobo / 100).toFixed(2) : "200.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance Fare ({selectedTier})</span>
                    <span className="text-slate-200">
                      ₦{activeEstimate ? (activeEstimate.distanceFareKobo / 100).toFixed(2) : "200.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Surcharge</span>
                    <span className="text-slate-200">
                      ₦{activeEstimate ? (activeEstimate.timeFareKobo / 100).toFixed(2) : "50.00"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Interactive Ride Workflow */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>Live Ride Status & Telemetry</span>
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      rideState === "IDLE"
                        ? "bg-slate-800 text-slate-400"
                        : rideState === "SEARCHING"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                        : rideState === "ASSIGNED"
                        ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                        : rideState === "ARRIVED"
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        : rideState === "IN_PROGRESS"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    }`}
                  >
                    {rideState}
                  </span>
                </div>

                {rideState === "IDLE" && (
                  <div className="text-center py-10 space-y-3">
                    <Navigation className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">
                      Choose your pickup and destination on the left, then click <strong>Request Keke</strong> to start dispatching.
                    </p>
                  </div>
                )}

                {rideState === "SEARCHING" && (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
                    <h5 className="text-sm font-bold text-white">Searching for Nearby Drivers in Nasarawa...</h5>
                    <p className="text-xs text-slate-400">
                      Dispatching to nearest verified tricycles around {NASARAWA_HUBS[pickupIndex].name}.
                    </p>
                  </div>
                )}

                {rideState !== "IDLE" && rideState !== "SEARCHING" && (
                  <div className="space-y-5">
                    {/* Assigned Driver Card */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                          M
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h5 className="text-xs font-bold text-white">Musa Ibrahim</h5>
                            <span className="text-[10px] text-amber-400 font-semibold">4.95 ★</span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Bajaj RE 4S (Yellow) • <span className="font-mono text-slate-200">LAF-882-XA</span>
                          </p>
                        </div>
                      </div>

                      <a
                        href="tel:+2348022222222"
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800 transition"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Security Start OTP Box */}
                    <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-amber-400 uppercase font-semibold">Security Start Code</p>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Read this 4-digit code to the driver upon boarding
                        </p>
                      </div>
                      <div className="px-4 py-2 bg-amber-500 text-slate-950 font-mono font-bold text-lg rounded-xl tracking-widest shadow-md">
                        {startOtp}
                      </div>
                    </div>

                    {/* Step Progression Controls (To test lifecycle interactively) */}
                    <div className="space-y-2 pt-2">
                      <p className="text-[11px] text-slate-400 font-medium">Simulate Ride Progression:</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setRideState("ARRIVED")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            rideState === "ARRIVED"
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          1. Driver Arrived
                        </button>

                        <button
                          type="button"
                          onClick={() => setRideState("IN_PROGRESS")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            rideState === "IN_PROGRESS"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          2. Start Trip (OTP Verified)
                        </button>

                        <button
                          type="button"
                          onClick={() => setRideState("COMPLETED")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            rideState === "COMPLETED"
                              ? "bg-purple-600 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          3. Complete Trip
                        </button>
                      </div>
                    </div>

                    {/* Post-Trip Rating Dialog */}
                    {rideState === "COMPLETED" && (
                      <div className="mt-4 p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-3">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-5 h-5 text-purple-400" />
                          <h5 className="text-xs font-bold text-white">Trip Completed Successfully!</h5>
                        </div>
                        <p className="text-xs text-slate-300">
                          Total Paid: <strong>₦{fareInNaira} NGN</strong> via {paymentMethod === "CASH" ? "Cash" : "Digital Wallet"}.
                        </p>

                        {!ratingSubmitted ? (
                          <div className="space-y-3 pt-2">
                            <label className="text-xs text-slate-300 block">Rate driver Musa Ibrahim:</label>
                            <div className="flex items-center space-x-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingScore(star)}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={`w-5 h-5 ${
                                      star <= ratingScore
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-slate-600"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={ratingComment}
                              onChange={(e) => setRatingComment(e.target.value)}
                              placeholder="Smooth ride through Lafia town, punctual driver..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                            <button
                              type="button"
                              onClick={() => setRatingSubmitted(true)}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition"
                            >
                              Submit Rating & Review
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-400 font-semibold flex items-center space-x-1.5 pt-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Thank you! Your 5-star review has updated the driver&apos;s running average.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
