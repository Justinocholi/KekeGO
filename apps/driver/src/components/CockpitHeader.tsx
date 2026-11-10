import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { BRAND_COLORS, DriverVerificationStatus } from "@kekego/shared";
import { useDriverAuth } from "../context/DriverAuthContext";

interface CockpitHeaderProps {
  onOpenEarnings: () => void;
  onOpenSOS: () => void;
  onOpenProfile: () => void;
}

export const CockpitHeader: React.FC<CockpitHeaderProps> = ({
  onOpenEarnings,
  onOpenSOS,
  onOpenProfile,
}) => {
  const { user, verificationStatus } = useDriverAuth();

  const balanceKobo = user?.wallet?.balanceKobo ?? 845000;
  const balanceNaira = (balanceKobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const isVerified =
    verificationStatus === DriverVerificationStatus.VERIFIED;

  return (
    <View style={styles.container}>
      {/* Driver Identity */}
      <TouchableOpacity
        style={styles.profilePill}
        onPress={onOpenProfile}
        activeOpacity={0.8}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : "D"}
          </Text>
        </View>
        <View style={styles.driverInfo}>
          <Text style={styles.driverGreeting}>Driver Cockpit</Text>
          <View style={styles.nameRow}>
            <Text style={styles.driverName} numberOfLines={1}>
              {user?.firstName || "Driver Partner"}
            </Text>
            <View
              style={[
                styles.statusTag,
                isVerified ? styles.statusVerified : styles.statusPending,
              ]}
            >
              <Text
                style={[
                  styles.statusTagText,
                  isVerified
                    ? styles.statusVerifiedText
                    : styles.statusPendingText,
                ]}
              >
                {verificationStatus}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Right Controls: Wallet & SOS */}
      <View style={styles.rightGroup}>
        {/* Wallet Balance Chip */}
        <TouchableOpacity
          style={styles.walletChip}
          onPress={onOpenEarnings}
          activeOpacity={0.8}
        >
          <Text style={styles.walletIcon}>₦</Text>
          <Text style={styles.walletAmount}>{balanceNaira}</Text>
        </TouchableOpacity>

        {/* SOS Emergency Trigger */}
        <TouchableOpacity
          style={styles.sosButton}
          onPress={onOpenSOS}
          activeOpacity={0.8}
        >
          <Text style={styles.sosText}>🚨</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.neutral.borderDark,
    elevation: 4,
  },
  profilePill: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  driverInfo: {
    justifyContent: "center",
  },
  driverGreeting: {
    fontSize: 10,
    color: BRAND_COLORS.neutral.textMutedDark,
    lineHeight: 12,
    fontWeight: "600",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  driverName: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textLight,
    maxWidth: 90,
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: "800",
  },
  statusVerified: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  statusVerifiedText: {
    color: BRAND_COLORS.status.success,
    fontSize: 9,
    fontWeight: "800",
  },
  statusPending: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
  },
  statusPendingText: {
    color: BRAND_COLORS.primary.DEFAULT,
    fontSize: 9,
    fontWeight: "800",
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BRAND_COLORS.primary.DEFAULT,
  },
  walletIcon: {
    color: BRAND_COLORS.primary.DEFAULT,
    fontWeight: "800",
    fontSize: 13,
    marginRight: 3,
  },
  walletAmount: {
    color: BRAND_COLORS.primary.DEFAULT,
    fontWeight: "700",
    fontSize: 13,
  },
  sosButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND_COLORS.status.error,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  sosText: {
    fontSize: 16,
  },
});
