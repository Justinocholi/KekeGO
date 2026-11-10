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
import { useDriverAuth } from "../context/DriverAuthContext";

interface DriverProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DriverProfileModal: React.FC<DriverProfileModalProps> = ({
  visible,
  onClose,
}) => {
  const { user, verificationStatus, logout } = useDriverAuth();

  if (!user) return null;

  const vehicle = user.driverProfile?.vehicles?.[0] || {
    plateNumber: "LAF-482-XA",
    make: "Bajaj",
    model: "RE 4S",
    color: "Yellow",
  };

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
          <Text style={styles.headerTitle}>Driver Partner Profile</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.body} contentContainerStyle={{ padding: 20 }}>
          {/* Avatar Section */}
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

          {/* Verification Status Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Verification Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {verificationStatus}
                </Text>
              </View>
            </View>
            <Text style={styles.licenseText}>
              Driver License: {user.driverProfile?.licenseNumber || "NSR-849204-DL"}
            </Text>
            <Text style={styles.inspectionSub}>
              Inspected by Nasarawa State Ministry of Transport & Kekego Safety Team.
            </Text>
          </View>

          {/* Vehicle Details Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Registered Tricycle</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plate Number:</Text>
              <Text style={styles.plateNumber}>{vehicle.plateNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Make & Model:</Text>
              <Text style={styles.detailVal}>
                {vehicle.make} {vehicle.model}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Color:</Text>
              <Text style={styles.detailVal}>{vehicle.color}</Text>
            </View>
          </View>

          {/* Lifetime Statistics */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Lifetime Performance</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>
                  ★ {Number(user.driverProfile?.rating ?? 5.0).toFixed(1)}
                </Text>
                <Text style={styles.statLbl}>Driver Rating</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>
                  {user.driverProfile?.totalTrips ?? 0}
                </Text>
                <Text style={styles.statLbl}>Trips Completed</Text>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutBtnText}>Sign Out Partner Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.neutral.canvasDark,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.neutral.borderDark,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND_COLORS.neutral.canvasDark,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textLight,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textLight,
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
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textLight,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: BRAND_COLORS.neutral.textMutedDark,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderDark,
    marginBottom: 14,
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
    color: BRAND_COLORS.neutral.textLight,
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: BRAND_COLORS.status.success,
  },
  licenseText: {
    fontSize: 12,
    color: BRAND_COLORS.neutral.textLight,
    fontWeight: "600",
    marginBottom: 4,
  },
  inspectionSub: {
    fontSize: 11,
    color: BRAND_COLORS.neutral.textMutedDark,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: BRAND_COLORS.neutral.textMutedDark,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textLight,
  },
  plateNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: BRAND_COLORS.primary.DEFAULT,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: "#131B2E",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  statVal: {
    fontSize: 14,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textLight,
    marginBottom: 2,
  },
  statLbl: {
    fontSize: 10,
    color: BRAND_COLORS.neutral.textMutedDark,
  },
  logoutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
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
