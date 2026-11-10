import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
} from "react-native";
import { BRAND_COLORS } from "@kekego/shared";

interface LocationPermissionModalProps {
  visible: boolean;
  onGrantPermission: () => void;
  onContinueManual: () => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  visible,
  onGrantPermission,
  onContinueManual,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        <View style={styles.contentCard}>
          {/* Brand Logo & Location Graphic */}
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>📍</Text>
          </View>

          <Text style={styles.title}>Enable Device GPS</Text>
          <Text style={styles.description}>
            Kekego needs your location to connect you with nearby verified
            commercial tricycles across Lafia, Keffi, and Karu in Nasarawa State.
          </Text>

          {/* Benefits list */}
          <View style={styles.benefitsList}>
            <View style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>⚡</Text>
              <Text style={styles.benefitText}>
                Instant pickup pin at your exact doorstep or market stall
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>🛡️</Text>
              <Text style={styles.benefitText}>
                Live SOS emergency tracking & verified route navigation
              </Text>
            </View>
          </View>

          {/* Grant Action */}
          <TouchableOpacity
            style={styles.grantBtn}
            onPress={onGrantPermission}
            activeOpacity={0.85}
          >
            <Text style={styles.grantBtnText}>Enable Accurate Location</Text>
          </TouchableOpacity>

          {/* Fallback / Manual Action */}
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={onContinueManual}
            activeOpacity={0.7}
          >
            <Text style={styles.manualBtnText}>
              Set Pickup Manually (Lafia Market)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  contentCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    elevation: 8,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRAND_COLORS.primary.subtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoBadgeText: {
    fontSize: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: BRAND_COLORS.neutral.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  benefitsList: {
    width: "100%",
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  benefitIcon: {
    fontSize: 16,
  },
  benefitText: {
    flex: 1,
    fontSize: 11,
    color: BRAND_COLORS.neutral.textPrimary,
    fontWeight: "600",
  },
  grantBtn: {
    width: "100%",
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  grantBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  manualBtn: {
    paddingVertical: 8,
  },
  manualBtnText: {
    color: BRAND_COLORS.neutral.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
});
