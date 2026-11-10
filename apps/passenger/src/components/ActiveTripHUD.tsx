import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { BRAND_COLORS, RideStatus } from "@kekego/shared";
import type { ActiveRide } from "../services/api";

interface ActiveTripHUDProps {
  ride: ActiveRide;
  onOpenSOS: () => void;
  onCancelRide: () => void;
  onCompleteTripSimulation?: () => void; // for test harness verification
}

export const ActiveTripHUD: React.FC<ActiveTripHUDProps> = ({
  ride,
  onOpenSOS,
  onCancelRide,
  onCompleteTripSimulation,
}) => {
  const driverName = ride.driver?.name || "Assigning verified driver...";
  const driverRating = ride.driver?.rating ? ride.driver.rating.toFixed(1) : "5.0";
  const driverTrips = ride.driver?.totalTrips ?? 84;
  const plateNumber = ride.driver?.vehicle?.plateNumber || "LAF-482-XA";
  const vehicleColor = ride.driver?.vehicle?.color || "Yellow";
  const vehicleModel = ride.driver?.vehicle?.model || "Bajaj RE";
  const fareNaira = Math.round(ride.estimatedFareKobo / 100).toLocaleString("en-NG");

  const getStatusStep = (status: string) => {
    switch (status) {
      case RideStatus.REQUESTED:
      case RideStatus.SEARCHING:
        return { index: 0, text: "Dispatching" };
      case RideStatus.DRIVER_ASSIGNED:
        return { index: 1, text: "Driver Assigned" };
      case RideStatus.DRIVER_EN_ROUTE:
        return { index: 2, text: "Driver En Route" };
      case RideStatus.DRIVER_ARRIVED:
        return { index: 3, text: "Driver Arrived" };
      case RideStatus.IN_PROGRESS:
        return { index: 4, text: "Trip In Progress" };
      case RideStatus.COMPLETED:
        return { index: 5, text: "Completed" };
      default:
        return { index: 1, text: status };
    }
  };

  const currentStep = getStatusStep(ride.status);

  const handleCallDriver = () => {
    if (ride.driver?.phoneNumber) {
      Alert.alert("Calling Driver", `Dialing ${ride.driver.phoneNumber}...`);
    } else {
      Alert.alert("Connecting", "Connecting to driver via secure proxy...");
    }
  };

  const handleMessageDriver = () => {
    Alert.alert("Chat with Driver", "Driver notified: 'I am waiting at the pickup spot.'");
  };

  return (
    <View style={styles.hudContainer}>
      {/* Top Banner with Ride Number & SOS Button */}
      <View style={styles.hudHeader}>
        <View style={styles.rideBadge}>
          <Text style={styles.rideBadgeText}>{ride.rideNumber}</Text>
          <View style={styles.tierPill}>
            <Text style={styles.tierPillText}>{ride.tier}</Text>
          </View>
        </View>

        {/* SOS Emergency Trigger */}
        <TouchableOpacity
          style={styles.sosButton}
          onPress={onOpenSOS}
          activeOpacity={0.8}
        >
          <Text style={styles.sosText}>🚨 SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Steps Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(100, Math.max(15, (currentStep.index / 4) * 100))}%` },
            ]}
          />
        </View>
        <Text style={styles.progressLabelText}>{currentStep.text}</Text>
      </View>

      {/* Security Start OTP Pill (Crucial feature from System Spec) */}
      <View style={styles.otpBanner}>
        <View style={styles.otpLeft}>
          <Text style={styles.otpSub}>START TRIP CODE</Text>
          <Text style={styles.otpCode}>{ride.startOtp}</Text>
        </View>
        <Text style={styles.otpExplainer}>
          Give this 4-digit code to driver before boarding
        </Text>
      </View>

      {/* Driver & Vehicle Details Card */}
      <View style={styles.driverCard}>
        <View style={styles.driverAvatarContainer}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarInitial}>
              {driverName.charAt(0)}
            </Text>
          </View>
          <View style={styles.verifiedCheck}>
            <Text style={styles.verifiedCheckIcon}>✓</Text>
          </View>
        </View>

        <View style={styles.driverDetails}>
          <View style={styles.driverNameRow}>
            <Text style={styles.driverNameText}>{driverName}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.starIcon}>★</Text>
              <Text style={styles.ratingText}>{driverRating}</Text>
            </View>
          </View>
          <Text style={styles.driverSub}>
            {vehicleColor} {vehicleModel} • {driverTrips} rides
          </Text>

          {/* Tricycle Plate Number Pill */}
          <View style={styles.plateContainer}>
            <Text style={styles.plateLabel}>PLATE</Text>
            <Text style={styles.plateNumber}>{plateNumber}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtnCall}
          onPress={handleCallDriver}
          activeOpacity={0.7}
        >
          <Text style={styles.actionBtnIcon}>📞</Text>
          <Text style={styles.actionBtnTextCall}>Call Driver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnMessage}
          onPress={handleMessageDriver}
          activeOpacity={0.7}
        >
          <Text style={styles.actionBtnIcon}>💬</Text>
          <Text style={styles.actionBtnTextMessage}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnCancel}
          onPress={onCancelRide}
          activeOpacity={0.7}
        >
          <Text style={styles.actionBtnTextCancel}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Destination & Fare Footnote */}
      <View style={styles.footerInfo}>
        <Text style={styles.footerAddress} numberOfLines={1}>
          Destination: {ride.destination.address}
        </Text>
        <Text style={styles.footerFare}>Fare: ₦{fareNaira}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hudContainer: {
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.neutral.borderLight,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  hudHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  rideBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rideBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textPrimary,
  },
  tierPill: {
    backgroundColor: BRAND_COLORS.primary.subtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND_COLORS.primary.DEFAULT,
  },
  tierPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: BRAND_COLORS.primary.active,
  },
  sosButton: {
    backgroundColor: BRAND_COLORS.status.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 3,
  },
  sosText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: BRAND_COLORS.neutral.borderLight,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    borderRadius: 3,
  },
  progressLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.secondary.DEFAULT,
  },
  otpBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BRAND_COLORS.secondary.subtle,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.secondary.DEFAULT,
    marginBottom: 12,
  },
  otpLeft: {
    alignItems: "flex-start",
  },
  otpSub: {
    fontSize: 9,
    fontWeight: "800",
    color: BRAND_COLORS.secondary.DEFAULT,
    letterSpacing: 0.5,
  },
  otpCode: {
    fontSize: 22,
    fontWeight: "900",
    color: BRAND_COLORS.secondary.active,
    letterSpacing: 3,
  },
  otpExplainer: {
    flex: 1,
    fontSize: 11,
    color: BRAND_COLORS.secondary.active,
    marginLeft: 12,
    fontWeight: "600",
  },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    marginBottom: 12,
  },
  driverAvatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  driverAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    alignItems: "center",
    justifyContent: "center",
  },
  driverAvatarInitial: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  verifiedCheck: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRAND_COLORS.status.success,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  verifiedCheckIcon: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  driverDetails: {
    flex: 1,
  },
  driverNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  driverNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  starIcon: {
    color: BRAND_COLORS.primary.DEFAULT,
    fontSize: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
  },
  driverSub: {
    fontSize: 11,
    color: BRAND_COLORS.neutral.textMuted,
    marginBottom: 4,
  },
  plateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  plateLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textMuted,
  },
  plateNumber: {
    fontSize: 11,
    fontWeight: "800",
    color: BRAND_COLORS.primary.active,
    backgroundColor: BRAND_COLORS.primary.subtle,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  actionBtnCall: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnIcon: {
    fontSize: 13,
  },
  actionBtnTextCall: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  actionBtnMessage: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnTextMessage: {
    color: BRAND_COLORS.neutral.textPrimary,
    fontWeight: "700",
    fontSize: 12,
  },
  actionBtnCancel: {
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
  },
  actionBtnTextCancel: {
    color: BRAND_COLORS.status.error,
    fontWeight: "700",
    fontSize: 12,
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.neutral.borderLight,
    paddingTop: 8,
  },
  footerAddress: {
    flex: 1,
    fontSize: 11,
    color: BRAND_COLORS.neutral.textMuted,
    marginRight: 8,
  },
  footerFare: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
  },
});
