import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { BRAND_COLORS, RideStatus } from "@kekego/shared";
import type { DriverActiveRide } from "../services/api";

interface ActivePickupNavigationHUDProps {
  ride: DriverActiveRide;
  onAdvanceStatus: (nextStatus: "DRIVER_EN_ROUTE" | "DRIVER_ARRIVED" | "COMPLETED") => void;
  onOpenStartOtpModal: () => void;
  onOpenSOS: () => void;
  isUpdating: boolean;
}

export const ActivePickupNavigationHUD: React.FC<ActivePickupNavigationHUDProps> = ({
  ride,
  onAdvanceStatus,
  onOpenStartOtpModal,
  onOpenSOS,
  isUpdating,
}) => {
  const isEnRoute = ride.status === RideStatus.DRIVER_EN_ROUTE;
  const isArrived = ride.status === RideStatus.DRIVER_ARRIVED;
  const isInProgress = ride.status === RideStatus.IN_PROGRESS;

  const fareNaira = Math.round(ride.estimatedFareKobo / 100).toLocaleString(
    "en-NG"
  );

  const handleCallPassenger = () => {
    Alert.alert(
      "Calling Passenger",
      `Dialing passenger ${ride.passenger.name} (${ride.passenger.phoneNumber})...`
    );
  };

  return (
    <View style={styles.hudContainer}>
      {/* Top Navigation Banner with Turn Instruction */}
      <View style={styles.navBanner}>
        <View style={styles.navIconBox}>
          <Text style={styles.navTurnIcon}>↱</Text>
        </View>
        <View style={styles.navInstructionBox}>
          <Text style={styles.navMeters}>In 200m</Text>
          <Text style={styles.navRoadName} numberOfLines={1}>
            Turn right onto Makurdi Road
          </Text>
        </View>
        <View style={styles.speedPill}>
          <Text style={styles.speedValue}>24</Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>
      </View>

      {/* Passenger Card & Call Action */}
      <View style={styles.passengerCard}>
        <View style={styles.passengerAvatar}>
          <Text style={styles.passengerInitial}>
            {ride.passenger.name.charAt(0)}
          </Text>
        </View>

        <View style={styles.passengerInfo}>
          <Text style={styles.passengerName}>{ride.passenger.name}</Text>
          <Text style={styles.passengerSub}>
            ★ {Number(ride.passenger.rating).toFixed(1)} • {ride.tier} Keke
          </Text>
          <Text style={styles.destinationSnippet} numberOfLines={1}>
            Destination: {ride.destination.address}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.callBtn}
          onPress={handleCallPassenger}
          activeOpacity={0.7}
        >
          <Text style={styles.callIcon}>📞</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Workflow Action Button */}
      {ride.status === RideStatus.DRIVER_ASSIGNED && (
        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() => onAdvanceStatus("DRIVER_EN_ROUTE")}
          disabled={isUpdating}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnText}>
            En Route to Pickup Spot ›
          </Text>
        </TouchableOpacity>
      )}

      {isEnRoute && (
        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() => onAdvanceStatus("DRIVER_ARRIVED")}
          disabled={isUpdating}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnText}>
            I Have Arrived at Pickup Spot ›
          </Text>
        </TouchableOpacity>
      )}

      {isArrived && (
        <TouchableOpacity
          style={styles.actionBtnOtp}
          onPress={onOpenStartOtpModal}
          disabled={isUpdating}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnOtpText}>
            🔐 Verify OTP & Start Trip
          </Text>
        </TouchableOpacity>
      )}

      {isInProgress && (
        <TouchableOpacity
          style={styles.actionBtnComplete}
          onPress={() => onAdvanceStatus("COMPLETED")}
          disabled={isUpdating}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnCompleteText}>
            ✓ Arrived at Destination • Complete Trip
          </Text>
        </TouchableOpacity>
      )}

      {/* Footer Details: Fare & SOS */}
      <View style={styles.footerRow}>
        <Text style={styles.footerFare}>Fare: ₦{fareNaira}</Text>
        <TouchableOpacity
          style={styles.footerSosBtn}
          onPress={onOpenSOS}
          activeOpacity={0.7}
        >
          <Text style={styles.footerSosText}>🚨 SOS Emergency</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hudContainer: {
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.neutral.borderDark,
    elevation: 16,
  },
  navBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#131B2E",
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  navIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  navTurnIcon: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "900",
  },
  navInstructionBox: {
    flex: 1,
  },
  navMeters: {
    fontSize: 10,
    fontWeight: "800",
    color: BRAND_COLORS.secondary.subtle,
  },
  navRoadName: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textLight,
  },
  speedPill: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  speedValue: {
    fontSize: 16,
    fontWeight: "900",
    color: BRAND_COLORS.primary.DEFAULT,
    lineHeight: 18,
  },
  speedUnit: {
    fontSize: 8,
    color: BRAND_COLORS.neutral.textMutedDark,
    fontWeight: "700",
  },
  passengerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  passengerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BRAND_COLORS.neutral.canvasDark,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  passengerInitial: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.secondary.DEFAULT,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textLight,
  },
  passengerSub: {
    fontSize: 11,
    color: BRAND_COLORS.neutral.textMutedDark,
    marginVertical: 1,
  },
  destinationSnippet: {
    fontSize: 11,
    color: BRAND_COLORS.primary.DEFAULT,
    fontWeight: "600",
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
  },
  callIcon: {
    fontSize: 18,
  },
  actionBtnPrimary: {
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
    elevation: 4,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  actionBtnOtp: {
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
    elevation: 4,
  },
  actionBtnOtpText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  actionBtnComplete: {
    backgroundColor: "#10B981",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
    elevation: 4,
  },
  actionBtnCompleteText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    paddingTop: 8,
  },
  footerFare: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textLight,
  },
  footerSosBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  footerSosText: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.status.error,
  },
});
