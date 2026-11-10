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

interface EmergencySOSModalProps {
  visible: boolean;
  onClose: () => void;
  currentCoordinates: { latitude: number; longitude: number };
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  visible,
  onClose,
  currentCoordinates,
}) => {
  const [broadcastEnabled, setBroadcastEnabled] = useState(true);

  const handleCallPolice = () => {
    Alert.alert(
      "Connecting to Emergency Services",
      "Calling Nasarawa State Police Command / FRSC Emergency Dispatch (112)..."
    );
  };

  const handleCallKekegoSafety = () => {
    Alert.alert(
      "Kekego 24/7 Safety Patrol",
      "Connecting to Kekego Rapid Response Center in Lafia..."
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
          {/* Top Red Badge */}
          <View style={styles.sosBadge}>
            <Text style={styles.sosEmoji}>🚨</Text>
          </View>

          <Text style={styles.title}>EMERGENCY SAFETY PANEL</Text>
          <Text style={styles.subtitle}>
            Immediate response for security, medical, or accident emergencies.
          </Text>

          {/* Current GPS Coordinates Broadcast Tag */}
          <View style={styles.gpsCard}>
            <View style={styles.gpsRow}>
              <View style={styles.liveDot} />
              <Text style={styles.gpsLabel}>CURRENT LIVE COORDINATES</Text>
            </View>
            <Text style={styles.gpsValue}>
              {currentCoordinates.latitude.toFixed(5)}° N,{" "}
              {currentCoordinates.longitude.toFixed(5)}° E
            </Text>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setBroadcastEnabled(!broadcastEnabled)}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleText}>
                {broadcastEnabled
                  ? "✓ Broadcasting to emergency contacts"
                  : "✗ Broadcast disabled"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.policeBtn}
            onPress={handleCallPolice}
            activeOpacity={0.8}
          >
            <Text style={styles.policeBtnText}>
              📞 Call Police Emergency (112)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.patrolBtn}
            onPress={handleCallKekegoSafety}
            activeOpacity={0.8}
          >
            <Text style={styles.patrolBtnText}>
              🛡️ Kekego 24/7 Safety Command
            </Text>
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Dismiss / False Alarm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  contentCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: BRAND_COLORS.neutral.cardLight,
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
    backgroundColor: "#FEE2E2",
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
    color: BRAND_COLORS.neutral.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  gpsCard: {
    width: "100%",
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    marginBottom: 16,
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND_COLORS.status.success,
    marginRight: 6,
  },
  gpsLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textMuted,
    letterSpacing: 0.5,
  },
  gpsValue: {
    fontSize: 13,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textPrimary,
    marginVertical: 2,
  },
  toggleRow: {
    marginTop: 4,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND_COLORS.secondary.DEFAULT,
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
  patrolBtn: {
    width: "100%",
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  patrolBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: BRAND_COLORS.neutral.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
});
