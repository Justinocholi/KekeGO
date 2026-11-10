import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { BRAND_COLORS } from "@kekego/shared";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProfile,
  onOpenNotifications,
  onOpenHistory,
}) => {
  const { user } = useAuth();
  const balanceKobo = user?.wallet?.balanceKobo ?? 250000;
  const balanceNaira = (balanceKobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <View style={styles.container}>
      {/* Profile Pill */}
      <TouchableOpacity
        style={styles.profilePill}
        onPress={onOpenProfile}
        activeOpacity={0.8}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : "P"}
          </Text>
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.greetingText}>Hello,</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.firstName || "Passenger"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Right Controls: Wallet & Notifications */}
      <View style={styles.rightGroup}>
        {/* Trip History Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onOpenHistory}
          activeOpacity={0.7}
        >
          <Text style={styles.iconText}>🕒</Text>
        </TouchableOpacity>

        {/* Wallet Balance Chip */}
        <TouchableOpacity
          style={styles.walletChip}
          onPress={onOpenProfile}
          activeOpacity={0.8}
        >
          <Text style={styles.walletIcon}>₦</Text>
          <Text style={styles.walletAmount}>{balanceNaira}</Text>
        </TouchableOpacity>

        {/* Notification Bell */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onOpenNotifications}
          activeOpacity={0.7}
        >
          <Text style={styles.iconText}>🔔</Text>
          <View style={styles.notificationDot} />
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
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.neutral.borderLight,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  profilePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    borderRadius: 24,
    paddingRight: 12,
    paddingLeft: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  nameContainer: {
    justifyContent: "center",
  },
  greetingText: {
    fontSize: 10,
    color: BRAND_COLORS.neutral.textMuted,
    lineHeight: 12,
  },
  userName: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
    maxWidth: 90,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.primary.subtle,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BRAND_COLORS.primary.DEFAULT,
  },
  walletIcon: {
    color: BRAND_COLORS.primary.active,
    fontWeight: "800",
    fontSize: 13,
    marginRight: 3,
  },
  walletAmount: {
    color: BRAND_COLORS.primary.active,
    fontWeight: "700",
    fontSize: 13,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconText: {
    fontSize: 16,
  },
  notificationDot: {
    position: "absolute",
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_COLORS.status.error,
  },
});
