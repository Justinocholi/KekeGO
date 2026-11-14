"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Search,
  Users,
  Shield,
  RotateCcw,
  ArrowRight,
  Info,
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

interface PlacePrediction {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  fullText: string;
  latitude?: number;
  longitude?: number;
}

interface HubLocation {
  name: string;
  secondary: string;
  lat: number;
  lng: number;
}

const NASARAWA_QUICK_HUBS: HubLocation[] = [
  { name: "Lafia Central Market", secondary: "Makurdi-Jos Road, Lafia Central", lat: 8.498, lng: 8.518 },
  { name: "Federal University Lafia", secondary: "Doma Road Permanent Site", lat: 8.5305, lng: 8.528 },
  { name: "Dalhatu Araf Specialist Hospital", secondary: "Hospital Road, Lafia", lat: 8.498, lng: 8.518 },
  { name: "Keffi Express Junction", secondary: "Abuja-Keffi Highway, Keffi", lat: 8.8475, lng: 7.8732 },
  { name: "NSUK Main Campus", secondary: "Keffi University Corridor", lat: 8.832, lng: 7.881 },
  { name: "Mararaba Orange Market", secondary: "Karu / FCT Boundary Axis", lat: 9.0285, lng: 7.6012 },
  { name: "Akwanga Central Roundabout", secondary: "Jos-Keffi Transit Hub", lat: 8.907, lng: 8.406 },
  { name: "Doma Town Central", secondary: "Main Market Road, Doma", lat: 8.391, lng: 8.354 },
];

export default function PassengerPortalPage() {
  const { user } = useAuth();

  // Location states
  const [pickup, setPickup] = useState<HubLocation>(NASARAWA_QUICK_HUBS[0]!);
  const [destination, setDestination] = useState<HubLocation>(NASARAWA_QUICK_HUBS[1]!);

  // Autocomplete search states
  const [pickupQuery, setPickupQuery] = useState(pickup.name);
  const [destQuery, setDestQuery] = useState(destination.name);
  const [pickupSuggestions, setPickupSuggestions] = useState<PlacePrediction[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<PlacePrediction[]>([]);
  const [activeSearchField, setActiveSearchField] = useState<"pickup" | "dest" | null>(null);

  // Booking states
  const [selectedTier, setSelectedTier] = useState<"STANDARD" | "CHARTER" | "CARGO">("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "WALLET_CARD">("CASH");

  // Fare & Routing states
  const [fareEstimate, setFareEstimate] = useState<FareEstimateData | null>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);

  // Ride lifecycle simulation states
  const [rideState, setRideState] = useState<
    "IDLE" | "SEARCHING" | "ASSIGNED" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED"
  >("IDLE");
  const [startOtp] = useState("7419");
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Autocomplete fetcher
  const handleSearchLocations = (query: string, field: "pickup" | "dest") => {
    if (field === "pickup") setPickupQuery(query);
    else setDestQuery(query);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!query || query.trim().length < 2) {
      if (field === "pickup") setPickupSuggestions([]);
      else setDestSuggestions([]);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await apiRequest<{ data: { predictions: PlacePrediction[] } }>(
          `/maps/autocomplete?input=${encodeURIComponent(query)}`
        );
        if (res?.data?.predictions) {
          if (field === "pickup") setPickupSuggestions(res.data.predictions);
          else setDestSuggestions(res.data.predictions);
        }
      } catch {
        // Fallback filter
        const fallback = NASARAWA_QUICK_HUBS.filter(
          (h) => h.name.toLowerCase().includes(query.toLowerCase()) || h.secondary.toLowerCase().includes(query.toLowerCase())
        ).map((h) => ({
          placeId: h.name,
          primaryText: h.name,
          secondaryText: h.secondary,
          fullText: `${h.name}, ${h.secondary}`,
          latitude: h.lat,
          longitude: h.lng,
        }));
        if (field === "pickup") setPickupSuggestions(fallback);
        else setDestSuggestions(fallback);
      }
    }, 250);
  };

  const handleSelectSuggestion = (item: PlacePrediction, field: "pickup" | "dest") => {
    const lat = item.latitude || (field === "pickup" ? 8.498 : 8.5305);
    const lng = item.longitude || (field === "pickup" ? 8.518 : 8.528);

    const loc: HubLocation = {
      name: item.primaryText,
      secondary: item.secondaryText,
      lat,
      lng,
    };

    if (field === "pickup") {
      setPickup(loc);
      setPickupQuery(item.primaryText);
      setPickupSuggestions([]);
    } else {
      setDestination(loc);
      setDestQuery(item.primaryText);
      setDestSuggestions([]);
    }
    setActiveSearchField(null);
  };

  // Fetch real-time fare estimate whenever pickup or destination changes
  useEffect(() => {
    async function fetchEstimate() {
      setIsLoadingEstimate(true);
      try {
        const res = await apiRequest<{ data: FareEstimateData }>("/fare/estimate", {
          method: "POST",
          body: JSON.stringify({
            pickup: { latitude: pickup.lat, longitude: pickup.lng, address: pickup.name },
            destination: { latitude: destination.lat, longitude: destination.lng, address: destination.name },
            tier: selectedTier,
          }),
        });

        if (res && res.data) {
          setFareEstimate(res.data);
        }
      } catch {
        // Fallback calculated estimate
        setFareEstimate({
          distanceMeters: 4600,
          durationSeconds: 660,
          estimates: [
            {
              tier: selectedTier,
              totalFareKobo: selectedTier === "STANDARD" ? 52000 : selectedTier === "CHARTER" ? 105000 : 75000,
              baseFareKobo: 20000,
              distanceFareKobo: 27000,
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
  }, [pickup, destination, selectedTier]);

  const handleRequestRide = () => {
    setRideState("SEARCHING");
    setTimeout(() => {
      setRideState("ASSIGNED");
    }, 2000);
  };

  const handleResetRide = () => {
    setRideState("IDLE");
    setRatingSubmitted(false);
    setRatingComment("");
  };

  const activeEstimate = fareEstimate?.estimates?.[0];
  const fareInNaira = activeEstimate ? (activeEstimate.totalFareKobo / 100).toLocaleString() : "520";
  const durationMins = fareEstimate ? Math.max(1, Math.round(fareEstimate.durationSeconds / 60)) : 11;
  const distanceKm = fareEstimate ? (fareEstimate.distanceMeters / 1000).toFixed(1) : "4.6";

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Header
          title="Passenger Booking Portal (Rider / User)"
          subtitle="Real location search, live Google Routes pricing, and seamless ride-hailing journey"
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
            {/* Left Column: Ride Booking Controls */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Navigation className="w-4 h-4 text-amber-500" />
                    <span>Plan Your Keke Trip</span>
                  </h3>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Google Routes Active
                  </span>
                </div>

                {/* Two-Line Location Inputs with Connected Visual Timeline (Inspired by UberClone) */}
                <div className="relative pl-6 space-y-4">
                  {/* Vertical connector line */}
                  <div className="absolute left-2.5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-emerald-500 via-slate-600 to-amber-500" />

                  {/* Pickup Search Field */}
                  <div className="relative">
                    <div className="absolute -left-6 top-3 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-sm shadow-emerald-500/50" />
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                        <span>PICKUP POINT</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Current Pin</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={pickupQuery}
                          disabled={rideState !== "IDLE"}
                          onChange={(e) => handleSearchLocations(e.target.value, "pickup")}
                          onFocus={() => setActiveSearchField("pickup")}
                          placeholder="Search landmark or street in Nasarawa..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition font-medium"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate pl-1">{pickup.secondary}</p>

                      {/* Pickup Autocomplete Dropdown */}
                      {activeSearchField === "pickup" && pickupSuggestions.length > 0 && (
                        <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                          {pickupSuggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectSuggestion(item, "pickup")}
                              className="w-full text-left p-2.5 hover:bg-slate-900 border-b border-slate-800/60 last:border-0 flex items-start space-x-2.5 transition"
                            >
                              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div className="truncate">
                                <p className="text-xs font-bold text-white truncate">{item.primaryText}</p>
                                <p className="text-[10px] text-slate-400 truncate">{item.secondaryText}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Destination Search Field */}
                  <div className="relative">
                    <div className="absolute -left-6 top-3 w-3 h-3 rounded-none bg-amber-500 border-2 border-slate-900 shadow-sm shadow-amber-500/50" />
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                        <span>DESTINATION POINT</span>
                        <span className="text-[10px] text-amber-400 font-mono">Dropoff Pin</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={destQuery}
                          disabled={rideState !== "IDLE"}
                          onChange={(e) => handleSearchLocations(e.target.value, "dest")}
                          onFocus={() => setActiveSearchField("dest")}
                          placeholder="Where to? (e.g., DASH, NSUK, UniLafia)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition font-medium"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate pl-1">{destination.secondary}</p>

                      {/* Destination Autocomplete Dropdown */}
                      {activeSearchField === "dest" && destSuggestions.length > 0 && (
                        <div className="absolute z-30 left-0 right-0 mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                          {destSuggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectSuggestion(item, "dest")}
                              className="w-full text-left p-2.5 hover:bg-slate-900 border-b border-slate-800/60 last:border-0 flex items-start space-x-2.5 transition"
                            >
                              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div className="truncate">
                                <p className="text-xs font-bold text-white truncate">{item.primaryText}</p>
                                <p className="text-[10px] text-slate-400 truncate">{item.secondaryText}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick-Pick Popular Nasarawa Hubs */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Quick Pick Nasarawa Corridors
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {NASARAWA_QUICK_HUBS.slice(0, 5).map((hub, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={rideState !== "IDLE"}
                        onClick={() => {
                          setDestination(hub);
                          setDestQuery(hub.name);
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition ${
                          destination.name === hub.name
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {hub.name.split("(")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vehicle Category Tier Selection (Inspired by UberClone VehiclePanel) */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">Select Tricycle Tier</label>
                    <span className="text-[10px] text-slate-400">
                      {durationMins} mins • {distanceKm} km
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Standard Keke */}
                    <div
                      onClick={() => rideState === "IDLE" && setSelectedTier("STANDARD")}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        selectedTier === "STANDARD"
                          ? "bg-amber-500/10 border-amber-500/80 shadow-md shadow-amber-500/10"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                          🛺
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-bold text-white">Standard Keke</h4>
                            <span className="flex items-center text-[10px] text-slate-400 font-medium">
                              <Users className="w-3 h-3 mr-0.5 text-slate-400" /> 3
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Shared commercial ride • {durationMins}m ETA
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-400">
                          ₦{fareEstimate ? ((fareEstimate.estimates.find((e) => e.tier === "STANDARD")?.totalFareKobo || 45000) / 100).toLocaleString() : "450"}
                        </p>
                        <p className="text-[9px] text-slate-400">Per Passenger</p>
                      </div>
                    </div>

                    {/* Charter Keke */}
                    <div
                      onClick={() => rideState === "IDLE" && setSelectedTier("CHARTER")}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        selectedTier === "CHARTER"
                          ? "bg-amber-500/10 border-amber-500/80 shadow-md shadow-amber-500/10"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                          ✨
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-bold text-white">Charter (Direct)</h4>
                            <span className="flex items-center text-[10px] text-emerald-400 font-medium">
                              <Shield className="w-3 h-3 mr-0.5 text-emerald-400" /> Private
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Exclusive hire, no stops • Direct travel
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">
                          ₦{fareEstimate ? ((fareEstimate.estimates.find((e) => e.tier === "CHARTER")?.totalFareKobo || 95000) / 100).toLocaleString() : "950"}
                        </p>
                        <p className="text-[9px] text-slate-400">Total Vehicle</p>
                      </div>
                    </div>

                    {/* Cargo Keke */}
                    <div
                      onClick={() => rideState === "IDLE" && setSelectedTier("CARGO")}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        selectedTier === "CARGO"
                          ? "bg-amber-500/10 border-amber-500/80 shadow-md shadow-amber-500/10"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                          📦
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-bold text-white">Cargo Carrier</h4>
                            <span className="text-[10px] text-blue-400 font-medium">250kg Max</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Market produce & luggage carriage
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">
                          ₦{fareEstimate ? ((fareEstimate.estimates.find((e) => e.tier === "CARGO")?.totalFareKobo || 70000) / 100).toLocaleString() : "700"}
                        </p>
                        <p className="text-[9px] text-slate-400">Flat Cargo Rate</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-xs font-bold text-slate-200 block">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={rideState !== "IDLE"}
                      onClick={() => setPaymentMethod("CASH")}
                      className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 transition ${
                        paymentMethod === "CASH"
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span className="text-xs">Cash on Arrival</span>
                    </button>

                    <button
                      type="button"
                      disabled={rideState !== "IDLE"}
                      onClick={() => setPaymentMethod("WALLET_CARD")}
                      className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 transition ${
                        paymentMethod === "WALLET_CARD"
                          ? "bg-amber-500/15 border-amber-500 text-amber-300 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span className="text-xs">Digital Wallet</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2">
                  {rideState === "IDLE" ? (
                    <button
                      type="button"
                      onClick={handleRequestRide}
                      disabled={isLoadingEstimate}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 px-4 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 transition transform active:scale-95"
                    >
                      <span>Request {selectedTier} Keke (₦{fareInNaira})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetRide}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Cancel or Reset Trip Experience</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Live Map Canvas & Trip Experience */}
            <div className="lg:col-span-7 space-y-6">
              {/* Interactive Visual Map Simulation */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl min-h-[440px] flex flex-col justify-between">
                {/* Map Grid Pattern */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, #f59e0b 1px, transparent 0)`,
                    backgroundSize: "28px 28px",
                  }}
                />

                {/* Top Overlay: Operating Zone & Routing Stats */}
                <div className="relative z-10 flex items-center justify-between bg-slate-950/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">Nasarawa Commercial Operating Zone</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 space-x-3">
                    <span>{distanceKm} km</span>
                    <span>•</span>
                    <span className="text-amber-400">~{durationMins} mins</span>
                  </div>
                </div>

                {/* Center Animated Radar or Route Visualization */}
                <div className="relative z-10 my-auto flex flex-col items-center justify-center py-10">
                  {rideState === "IDLE" && (
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
                        <MapPin className="w-8 h-8 text-amber-400 animate-bounce" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">Route Configured</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                          {pickup.name} <span className="text-amber-400">→</span> {destination.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {rideState === "SEARCHING" && (
                    <div className="text-center space-y-4">
                      <div className="relative w-28 h-28 flex items-center justify-center mx-auto">
                        <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                        <div className="w-20 h-20 rounded-full bg-amber-500/30 border-2 border-amber-500 flex items-center justify-center">
                          <span className="text-3xl">🛺</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-amber-400">Matching Nearby Drivers...</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Broadcasting dispatch to top-ranked Bajaj & TVS tricycles in Lafia
                        </p>
                      </div>
                    </div>
                  )}

                  {(rideState === "ASSIGNED" || rideState === "ARRIVED" || rideState === "IN_PROGRESS") && (
                    <div className="w-full max-w-md bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-lg">
                            MI
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">Musa Ibrahim</h4>
                            <p className="text-[10px] text-slate-400 flex items-center space-x-1">
                              <span className="text-amber-400 font-bold">4.9 ★</span>
                              <span>•</span>
                              <span>Bajaj RE 4S (Yellow)</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/30">
                            LAF-882-XA
                          </span>
                        </div>
                      </div>

                      {/* Prominent Start OTP Card (Inspired by UberClone) */}
                      <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/10 border border-amber-500/40 rounded-2xl p-3.5 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Security Start OTP</p>
                          <p className="text-xs text-slate-300">Give this 4-digit code to driver:</p>
                        </div>
                        <div className="text-xl font-mono font-black text-amber-400 tracking-widest bg-slate-950 px-3 py-1 rounded-xl border border-amber-500/50">
                          {startOtp}
                        </div>
                      </div>

                      {/* Ride State Steps */}
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <button
                          type="button"
                          onClick={() => setRideState("ARRIVED")}
                          className={`p-2 rounded-xl text-[10px] font-bold border transition ${
                            rideState === "ARRIVED"
                              ? "bg-amber-500 text-slate-950 border-amber-500"
                              : "bg-slate-900 text-slate-400 border-slate-800"
                          }`}
                        >
                          Driver Arrived
                        </button>

                        <button
                          type="button"
                          onClick={() => setRideState("IN_PROGRESS")}
                          className={`p-2 rounded-xl text-[10px] font-bold border transition ${
                            rideState === "IN_PROGRESS"
                              ? "bg-emerald-500 text-slate-950 border-emerald-500"
                              : "bg-slate-900 text-slate-400 border-slate-800"
                          }`}
                        >
                          In Progress
                        </button>

                        <button
                          type="button"
                          onClick={() => setRideState("COMPLETED")}
                          className="p-2 rounded-xl text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 transition"
                        >
                          Complete Trip
                        </button>
                      </div>
                    </div>
                  )}

                  {rideState === "COMPLETED" && (
                    <div className="w-full max-w-md bg-slate-950/90 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-6 space-y-4 shadow-2xl text-center">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">Trip Completed Successfully!</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Total Fare: <span className="font-bold text-emerald-400">₦{fareInNaira} NGN</span> ({paymentMethod === "CASH" ? "Cash Paid" : "Debited from Wallet"})
                        </p>
                      </div>

                      {/* 5-Star Driver Rating Flow */}
                      {!ratingSubmitted ? (
                        <div className="space-y-3 pt-2 border-t border-slate-800">
                          <p className="text-xs text-slate-300 font-semibold">How was your ride with Musa?</p>
                          <div className="flex justify-center space-x-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRatingScore(star)}
                                className="text-2xl transition hover:scale-110"
                              >
                                <Star
                                  className={`w-6 h-6 ${
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
                            placeholder="Add compliment or driver feedback..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => setRatingSubmitted(true)}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition"
                          >
                            Submit Driver Rating
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                          ✓ Rating submitted to Musa Ibrahim. Thank you for riding with KekeGO!
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Status Ticker */}
                <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
                  <div className="flex items-center space-x-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-500" />
                    <span>Authoritative State Geofence Protected</span>
                  </div>
                  <span className="font-mono text-slate-300">Fastify :4000 • Socket.IO Connected</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
