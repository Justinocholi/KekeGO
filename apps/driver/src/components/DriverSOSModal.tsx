import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
} from "react-native";
import { BRAND_COLORS } from "@kekego/shared";

interface DriverSOSModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DriverSOSModal: React.FC<DriverSOSModalProps> = ({
  visible,
  onClose,
}) => {
  const [broadcastEnabled, setBroadcastEnabled] = useState(true);

  const handleCallPolice = () => {
    Alert.alert(
      "Connecting to Emergency",
      "Calling Nasarawa State Police Command / FRSC Road Patrol (112)..."
    );
  };

  const handleCallFleetPatrol = () => {
    Alert.alert(
      "Kekego Fleet Patrol",
      "Connecting to Kekego Lafia Fleet Security Desk..."
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.contentCard}>
          <View style={styles.sosBadge}>
            <Text style={styles.sosEmoji}>🚨</Text>
          </View>

          <Text style={styles.title}>DRIVER EMERGENCY PANEL</Text>
          <Text style={styles.subtitle}>
            Immediate assistance for road traffic incidents, security concerns, or vehicle distress.
          </Text>

          {/* Live Location Tag */}
          <View style={styles.gpsCard}>
            <Text style={styles.gpsLabel}>CURRENT LOCATION BROADCAST</Text>
            <Text style={styles.gpsValue}>
              Lafia Modern Market Corridor (8.4932° N, 8.5158° E)
            </Text>
            <TouchableOpacity
              onPress={() => setBroadcastEnabled(!broadcastEnabled)}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleText}>
                {broadcastEnabled
                  ? "✓ GPS beacon broadcasting to security command"
                  : "✗ Broadcast disabled"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.policeBtn}
            onPress={handleCallPolice}
            activeOpacity={0.8}
          >
            <Text style={styles.policeBtnText}>
              📞 Emergency Road Dispatch (112)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fleetBtn}
            onPress={handleCallFleetPatrol}
            activeOpacity={0.8}
          >
            <Text style={styles.fleetBtnText}>
              🛡️ Kekego 24/7 Fleet Safety Desk
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Dismiss / Stand Down</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  contentCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: BRAND_COLORS.status.error,
  },
  sosBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  sosEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: BRAND_COLORS.status.error,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: BRAND_COLORS.neutral.textMutedDark,
    textAlign: "center",
    marginBottom: 16,
  },
  gpsCard: {
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  gpsLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textMutedDark,
  },
  gpsValue: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textLight,
    marginVertical: 2,
  },
  toggleText: {
    fontSize: 11,
    color: BRAND_COLORS.secondary.DEFAULT,
    fontWeight: "600",
    marginTop: 2,
  },
  policeBtn: {
    width: "100%",
    backgroundColor: BRAND_COLORS.status.error,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  policeBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  fleetBtn: {
    width: "100%",
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  fleetBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  cancelBtn: {
    paddingVertical: 6,
  },
  cancelBtnText: {
    color: BRAND_COLORS.neutral.textMutedDark,
    fontSize: 12,
    fontWeight: "600",
  },
});
