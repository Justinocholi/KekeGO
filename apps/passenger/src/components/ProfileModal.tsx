import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { BRAND_COLORS } from "@kekego/shared";
import { useAuth } from "../context/AuthContext";

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
}) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const balanceKobo = user.wallet?.balanceKobo ?? 250000;
  const balanceNaira = (balanceKobo / 100).toLocaleString("en-NG");
  const rating = user.passengerProfile?.rating ?? 5.0;
  const totalRides = user.passengerProfile?.totalRides ?? 0;
  const emergencyName = user.passengerProfile?.emergencyContactName || "Not configured";
  const emergencyPhone = user.passengerProfile?.emergencyContactPhone || "Not configured";

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Passenger Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.body} contentContainerStyle={{ padding: 20 }}>
          {/* Avatar & Name */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {user.firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.userName}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.userPhone}>{user.phoneNumber}</Text>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>★ {Number(rating).toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rider Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{totalRides}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
          </View>

          {/* Wallet Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>In-App Wallet</Text>
              <View style={styles.verifiedTag}>
                <Text style={styles.verifiedTagText}>Active</Text>
              </View>
            </View>
            <Text style={styles.walletBalanceText}>₦{balanceNaira}</Text>
            <Text style={styles.walletSub}>
              Available balance for metered rides across Nasarawa State.
            </Text>
          </View>

          {/* Safety & Emergency Contact */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <Text style={styles.sectionSubtitle}>
              Shared automatically with local authorities when you trigger SOS.
            </Text>
            <View style={styles.emergencyDetailRow}>
              <Text style={styles.emergencyLabel}>Contact Name:</Text>
              <Text style={styles.emergencyValue}>{emergencyName}</Text>
            </View>
            <View style={styles.emergencyDetailRow}>
              <Text style={styles.emergencyLabel}>Phone Number:</Text>
              <Text style={styles.emergencyValue}>{emergencyPhone}</Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.neutral.borderLight,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
  },
  body: {
    flex: 1,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    elevation: 3,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textPrimary,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: BRAND_COLORS.neutral.textMuted,
    fontWeight: "600",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    marginBottom: 16,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: BRAND_COLORS.neutral.textMuted,
  },
  statDivider: {
    width: 1,
    backgroundColor: BRAND_COLORS.neutral.borderLight,
  },
  sectionCard: {
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
  },
  verifiedTag: {
    backgroundColor: BRAND_COLORS.secondary.subtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: BRAND_COLORS.secondary.DEFAULT,
  },
  walletBalanceText: {
    fontSize: 24,
    fontWeight: "900",
    color: BRAND_COLORS.primary.active,
    marginBottom: 4,
  },
  walletSub: {
    fontSize: 11,
    color: BRAND_COLORS.neutral.textMuted,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: BRAND_COLORS.neutral.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  emergencyDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  emergencyLabel: {
    fontSize: 12,
    color: BRAND_COLORS.neutral.textMuted,
  },
  emergencyValue: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
  },
  logoutBtn: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  logoutBtnText: {
    color: BRAND_COLORS.status.error,
    fontWeight: "700",
    fontSize: 14,
  },
});
