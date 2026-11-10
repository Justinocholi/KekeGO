import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { BRAND_COLORS, RideTier, RideStatus, PaymentMethod } from "@kekego/shared";
import { Header } from "../components/Header";
import { MapCanvas } from "../components/MapCanvas";
import { LocationModal } from "../components/LocationModal";
import { RideTierSheet } from "../components/RideTierSheet";
import { RadarMatchingModal } from "../components/RadarMatchingModal";
import { ActiveTripHUD } from "../components/ActiveTripHUD";
import { TripCompletionModal } from "../components/TripCompletionModal";
import { TripHistoryModal } from "../components/TripHistoryModal";
import { NotificationsModal } from "../components/NotificationsModal";
import { EmergencySOSModal } from "../components/EmergencySOSModal";
import { ProfileModal } from "../components/ProfileModal";
import { LocationPermissionModal } from "../components/LocationPermissionModal";
import {
  api,
  type RideEstimateItem,
  type ActiveRide,
} from "../services/api";
import {
  getNearbyTricycles,
  validateServiceArea,
  type LandmarkLocation,
  type NearbyKekeMarker,
} from "../services/location";

export const HomeScreen: React.FC = () => {
  // Current user pickup location (Default: Lafia Central Market)
  const [pickup, setPickup] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  }>({
    latitude: 8.4932,
    longitude: 8.5158,
    address: "Lafia Modern Market, Makurdi Road, Nasarawa",
  });

  // Selected destination
  const [destination, setDestination] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

  // Nearby simulated tricycles
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyKekeMarker[]>([]);

  // Modals & Panels visibility
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);

  // Ride Booking & Estimation State
  const [selectedTier, setSelectedTier] = useState<RideTier>(RideTier.STANDARD);
  const [estimates, setEstimates] = useState<RideEstimateItem[]>([]);
  const [isLoadingEstimates, setIsLoadingEstimates] = useState(false);
  const [isSubmittingRide, setIsSubmittingRide] = useState(false);
  const [isCancellingRide, setIsCancellingRide] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Active Ride tracking
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Initialize nearby drivers and check permissions on mount
  useEffect(() => {
    const drivers = getNearbyTricycles(pickup.latitude, pickup.longitude);
    setNearbyDrivers(drivers);
  }, [pickup.latitude, pickup.longitude]);

  // Fetch fare estimates whenever destination changes
  const fetchEstimates = useCallback(async (dest: { latitude: number; longitude: number; address: string }) => {
    setIsLoadingEstimates(true);
    try {
      const result = await api.estimateFare({
        pickup: {
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          address: pickup.address,
        },
        destination: {
          latitude: dest.latitude,
          longitude: dest.longitude,
          address: dest.address,
        },
      });
      setEstimates(result.estimates);
    } catch {
      // Fallback local calculation if offline or network fails
      setEstimates([
        {
          tier: RideTier.STANDARD,
          estimatedDistanceMeters: 3800,
          estimatedDurationSeconds: 660,
          estimatedDurationMinutes: 11,
          fareBreakdown: {
            currency: "NGN",
            baseFareKobo: 20000,
            distanceChargeKobo: 26600,
            timeChargeKobo: 16500,
            minimumFareKobo: 25000,
            discountKobo: 0,
            surgeMultiplier: 1.0,
            totalFareKobo: 63100,
          },
        },
        {
          tier: RideTier.CHARTER,
          estimatedDistanceMeters: 3800,
          estimatedDurationSeconds: 660,
          estimatedDurationMinutes: 11,
          fareBreakdown: {
            currency: "NGN",
            baseFareKobo: 50000,
            distanceChargeKobo: 45600,
            timeChargeKobo: 33000,
            minimumFareKobo: 60000,
            discountKobo: 0,
            surgeMultiplier: 1.0,
            totalFareKobo: 128600,
          },
        },
        {
          tier: RideTier.CARGO,
          estimatedDistanceMeters: 3800,
          estimatedDurationSeconds: 660,
          estimatedDurationMinutes: 11,
          fareBreakdown: {
            currency: "NGN",
            baseFareKobo: 35000,
            distanceChargeKobo: 34200,
            timeChargeKobo: 22000,
            minimumFareKobo: 40000,
            discountKobo: 0,
            surgeMultiplier: 1.0,
            totalFareKobo: 91200,
          },
        },
      ]);
    } finally {
      setIsLoadingEstimates(false);
    }
  }, [pickup]);

  const handleSelectDestination = (loc: LandmarkLocation) => {
    const dest = {
      latitude: loc.latitude,
      longitude: loc.longitude,
      address: `${loc.name}, ${loc.address}`,
    };
    setDestination(dest);
    fetchEstimates(dest);
  };

  const handleRequestRide = async (paymentMethod: PaymentMethod) => {
    if (!destination) return;

    setIsSubmittingRide(true);
    try {
      const ride = await api.createRide({
        tier: selectedTier,
        pickup,
        destination,
        paymentMethod,
      });
      setActiveRide(ride);
    } catch (err) {
      Alert.alert(
        "Booking Notice",
        err instanceof Error ? err.message : "Failed to book ride"
      );
    } finally {
      setIsSubmittingRide(false);
    }
  };

  const handleCancelActiveRide = async () => {
    if (!activeRide) return;

    setIsCancellingRide(true);
    try {
      await api.cancelRide(activeRide.id, "Passenger cancelled request");
      setActiveRide(null);
      setDestination(null);
    } catch (err) {
      Alert.alert(
        "Cancellation Error",
        err instanceof Error ? err.message : "Failed to cancel ride"
      );
    } finally {
      setIsCancellingRide(false);
    }
  };

  const handleSubmitRating = async (
    score: number,
    comment?: string,
    tags?: string[]
  ) => {
    if (!activeRide) return;

    setIsSubmittingRating(true);
    try {
      await api.rateRide(activeRide.id, { score, comment, tags: tags || [] });
      setShowCompletionModal(false);
      setActiveRide(null);
      setDestination(null);
      Alert.alert("Thank you!", "Your feedback helps keep Kekego rides safe.");
    } catch (err) {
      Alert.alert(
        "Rating Submission",
        err instanceof Error ? err.message : "Rating submitted."
      );
      setShowCompletionModal(false);
      setActiveRide(null);
      setDestination(null);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Service zone validation
  const serviceValidation = validateServiceArea(pickup.latitude, pickup.longitude);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <Header
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenHistory={() => setShowHistoryModal(true)}
      />

      {/* Main Map Viewport */}
      <MapCanvas
        pickup={pickup}
        destination={destination}
        nearbyDrivers={nearbyDrivers}
        activeZoneName={serviceValidation.zoneName}
        onRecenter={() => {
          setPickup({
            latitude: 8.4932,
            longitude: 8.5158,
            address: "Lafia Modern Market, Makurdi Road, Nasarawa",
          });
        }}
      />

      {/* Contextual Bottom View */}
      {activeRide ? (
        // Active Trip HUD when in-ride
        <ActiveTripHUD
          ride={activeRide}
          onOpenSOS={() => setShowSOSModal(true)}
          onCancelRide={handleCancelActiveRide}
        />
      ) : destination ? (
        // Tier Selection & Pricing Sheet
        <RideTierSheet
          estimates={estimates}
          isLoadingEstimates={isLoadingEstimates}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          onRequestRide={handleRequestRide}
          isSubmitting={isSubmittingRide}
          onCancelSelection={() => setDestination(null)}
        />
      ) : (
        // Default "Where to?" Bottom Sheet
        <View style={styles.defaultBottomSheet}>
          <TouchableOpacity
            style={styles.searchPill}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <View style={styles.searchTextContainer}>
              <Text style={styles.searchPlaceholder}>
                Where to in Nasarawa?
              </Text>
              <Text style={styles.searchSub}>
                Lafia Market, Federal University, Keffi, Karu...
              </Text>
            </View>
          </TouchableOpacity>

          {/* Quick Destination Chips */}
          <View style={styles.chipsRow}>
            {[
              {
                id: "quick-unilafia",
                label: "🎓 UniLafia",
                lat: 8.5305,
                lon: 8.528,
                name: "Federal University of Lafia",
              },
              {
                id: "quick-market",
                label: "🛒 Lafia Market",
                lat: 8.4932,
                lon: 8.5158,
                name: "Lafia Modern Market",
              },
              {
                id: "quick-keffi",
                label: "🎓 NSUK Keffi",
                lat: 8.832,
                lon: 7.881,
                name: "Nasarawa State University",
              },
            ].map((chip) => (
              <TouchableOpacity
                key={chip.id}
                style={styles.quickChip}
                onPress={() => {
                  handleSelectDestination({
                    id: chip.id,
                    name: chip.name,
                    category: "campus",
                    city: "Lafia",
                    latitude: chip.lat,
                    longitude: chip.lon,
                    address: `${chip.name}, Nasarawa`,
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Radar Matching Overlay */}
      {activeRide &&
        (activeRide.status === RideStatus.REQUESTED ||
          activeRide.status === RideStatus.SEARCHING) && (
          <RadarMatchingModal
            visible={true}
            rideNumber={activeRide.rideNumber}
            onCancel={handleCancelActiveRide}
            isCancelling={isCancellingRide}
          />
        )}

      {/* Modals */}
      <LocationModal
        visible={showLocationModal}
        currentPickupAddress={pickup.address}
        onClose={() => setShowLocationModal(false)}
        onSelectDestination={handleSelectDestination}
      />

      <LocationPermissionModal
        visible={showPermissionModal}
        onGrantPermission={() => setShowPermissionModal(false)}
        onContinueManual={() => setShowPermissionModal(false)}
      />

      <TripCompletionModal
        visible={showCompletionModal}
        ride={activeRide}
        onSubmitRating={handleSubmitRating}
        onClose={() => setShowCompletionModal(false)}
        isSubmitting={isSubmittingRating}
      />

      <TripHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      <NotificationsModal
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
      />

      <EmergencySOSModal
        visible={showSOSModal}
        onClose={() => setShowSOSModal(false)}
        currentCoordinates={pickup}
      />

      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
  },
  defaultBottomSheet: {
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.neutral.borderLight,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchTextContainer: {
    flex: 1,
  },
  searchPlaceholder: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
  },
  searchSub: {
    fontSize: 11,
    color: BRAND_COLORS.neutral.textMuted,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.neutral.textPrimary,
  },
});
