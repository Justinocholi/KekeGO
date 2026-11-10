import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { BRAND_COLORS, DriverVerificationStatus } from "@kekego/shared";
import { CockpitHeader } from "../components/CockpitHeader";
import { AvailabilityToggle } from "../components/AvailabilityToggle";
import { VerificationStatusBanner } from "../components/VerificationStatusBanner";
import { EarningsHUD } from "../components/EarningsHUD";
import { CockpitMap } from "../components/CockpitMap";
import { IncomingDispatchModal } from "../components/IncomingDispatchModal";
import { ActivePickupNavigationHUD } from "../components/ActivePickupNavigationHUD";
import { StartOtpModal } from "../components/StartOtpModal";
import { EarningsModal } from "../components/EarningsModal";
import { DriverSOSModal } from "../components/DriverSOSModal";
import { DriverProfileModal } from "../components/DriverProfileModal";
import { useDriverAuth } from "../context/DriverAuthContext";
import {
  driverApi,
  type DispatchItem,
  type DriverActiveRide,
  type DriverEarningsSummary,
} from "../services/api";

export const DriverCockpitScreen: React.FC = () => {
  const { isOnline, verificationStatus, refreshProfile } = useDriverAuth();

  // Active Ride & Dispatches State
  const [activeRide, setActiveRide] = useState<DriverActiveRide | null>(null);
  const [incomingDispatch, setIncomingDispatch] = useState<DispatchItem | null>(null);
  const [isAcceptingDispatch, setIsAcceptingDispatch] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Modals Visibility
  const [showStartOtpModal, setShowStartOtpModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Earnings Summary Metrics
  const [earningsSummary, setEarningsSummary] = useState<DriverEarningsSummary | null>(null);

  // Load active ride & earnings on mount
  const checkActiveRideAndMetrics = useCallback(async () => {
    try {
      const [ride, summary] = await Promise.all([
        driverApi.getActiveRide(),
        driverApi.getEarningsSummary(),
      ]);
      setActiveRide(ride);
      setEarningsSummary(summary);
    } catch {
      // offline or initial session
    }
  }, []);

  useEffect(() => {
    checkActiveRideAndMetrics();
  }, [checkActiveRideAndMetrics]);

  // Dispatch listener: check for available rides when online and not on active trip
  useEffect(() => {
    if (!isOnline || activeRide || verificationStatus !== DriverVerificationStatus.VERIFIED) {
      setIncomingDispatch(null);
      return;
    }

    const pollDispatches = async () => {
      try {
        const dispatches = await driverApi.getDispatches();
        if (dispatches && dispatches.length > 0 && !incomingDispatch) {
          setIncomingDispatch(dispatches[0]);
        }
      } catch {
        // quiet error during background polling
      }
    };

    pollDispatches();
    const interval = setInterval(pollDispatches, 8000);

    return () => clearInterval(interval);
  }, [isOnline, activeRide, verificationStatus, incomingDispatch]);

  // Driver accepts dispatch
  const handleAcceptDispatch = async (dispatchId: string) => {
    setIsAcceptingDispatch(true);
    try {
      const accepted = await driverApi.acceptRide(dispatchId);
      setActiveRide(accepted);
      setIncomingDispatch(null);
    } catch (err) {
      Alert.alert(
        "Dispatch Unavailable",
        err instanceof Error ? err.message : "Ride has already been taken"
      );
      setIncomingDispatch(null);
    } finally {
      setIsAcceptingDispatch(false);
    }
  };

  const handleDeclineDispatch = () => {
    setIncomingDispatch(null);
  };

  // Advance ride status: En Route -> Arrived -> Complete
  const handleAdvanceStatus = async (
    nextStatus: "DRIVER_EN_ROUTE" | "DRIVER_ARRIVED" | "COMPLETED"
  ) => {
    if (!activeRide) return;

    setIsUpdatingStatus(true);
    try {
      const result = await driverApi.updateRideStatus(activeRide.id, {
        status: nextStatus,
      });

      if (nextStatus === "COMPLETED") {
        Alert.alert(
          "Trip Completed!",
          `Ride ${activeRide.rideNumber} finished. Earnings credited to your wallet.`
        );
        setActiveRide(null);
        await checkActiveRideAndMetrics();
        await refreshProfile();
      } else {
        setActiveRide({
          ...activeRide,
          status: result.status,
        });
      }
    } catch (err) {
      Alert.alert(
        "Status Update Error",
        err instanceof Error ? err.message : "Failed to update trip status"
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Verify passenger start OTP
  const handleVerifyStartOtp = async (startOtp: string) => {
    if (!activeRide) return;

    setIsUpdatingStatus(true);
    try {
      const result = await driverApi.updateRideStatus(activeRide.id, {
        status: "IN_PROGRESS",
        startOtp,
      });

      setActiveRide({
        ...activeRide,
        status: result.status,
      });
      setShowStartOtpModal(false);
      Alert.alert("Boarding Verified!", "Trip is now in progress. Drive safely.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const netEarningsKobo =
    earningsSummary?.today?.netEarningsKobo ?? 845000;
  const completedTrips = earningsSummary?.today?.completedTrips ?? 7;
  const acceptanceRate =
    earningsSummary?.metrics?.acceptanceRatePercent ?? 96;
  const rating = earningsSummary?.metrics?.rating ?? 4.9;

  return (
    <View style={styles.container}>
      {/* Cockpit Header */}
      <CockpitHeader
        onOpenEarnings={() => setShowEarningsModal(true)}
        onOpenSOS={() => setShowSOSModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Online / Offline Availability Toggle */}
      <AvailabilityToggle />

      {/* Verification Status Warning if not fully verified */}
      <VerificationStatusBanner
        status={verificationStatus}
        onOpenOnboarding={() => setShowProfileModal(true)}
      />

      {/* Today's Earnings HUD (if not currently on active trip) */}
      {!activeRide && (
        <EarningsHUD
          netEarningsKobo={netEarningsKobo}
          completedTrips={completedTrips}
          acceptanceRatePercent={acceptanceRate}
          driverRating={rating}
          onPress={() => setShowEarningsModal(true)}
        />
      )}

      {/* Interactive Cockpit Navigation Map */}
      <CockpitMap
        activeRide={activeRide}
        onRecenter={() => {}}
      />

      {/* Active Trip Navigation HUD */}
      {activeRide && (
        <ActivePickupNavigationHUD
          ride={activeRide}
          onAdvanceStatus={handleAdvanceStatus}
          onOpenStartOtpModal={() => setShowStartOtpModal(true)}
          onOpenSOS={() => setShowSOSModal(true)}
          isUpdating={isUpdatingStatus}
        />
      )}

      {/* Time-Critical Incoming Ride Dispatch Modal */}
      <IncomingDispatchModal
        dispatch={incomingDispatch}
        onAccept={handleAcceptDispatch}
        onDecline={handleDeclineDispatch}
        isAccepting={isAcceptingDispatch}
      />

      {/* Start OTP Modal */}
      {activeRide && (
        <StartOtpModal
          visible={showStartOtpModal}
          passengerName={activeRide.passenger.name}
          onVerifyAndStart={handleVerifyStartOtp}
          onClose={() => setShowStartOtpModal(false)}
          isSubmitting={isUpdatingStatus}
        />
      )}

      {/* Earnings & Settlement Modal */}
      <EarningsModal
        visible={showEarningsModal}
        onClose={() => setShowEarningsModal(false)}
      />

      {/* Emergency SOS Modal */}
      <DriverSOSModal
        visible={showSOSModal}
        onClose={() => setShowSOSModal(false)}
      />

      {/* Driver Profile Modal */}
      <DriverProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.neutral.canvasDark,
  },
});
