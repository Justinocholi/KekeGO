import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BRAND_COLORS, DriverVerificationStatus } from "@kekego/shared";
import { useDriverAuth } from "../context/DriverAuthContext";

export const AvailabilityToggle: React.FC = () => {
  const { isOnline, verificationStatus, toggleAvailability } = useDriverAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const isEligible =
    verificationStatus === DriverVerificationStatus.VERIFIED;

  const handleToggle = async () => {
    if (!isEligible && !isOnline) {
      Alert.alert(
        "Verification Required",
        `You cannot go online because your account verification status is ${verificationStatus}. Please complete physical vehicle inspection and administrative review to activate online dispatch.`
      );
      return;
    }

    setIsUpdating(true);
    try {
      await toggleAvailability(!isOnline);
    } catch (err) {
      Alert.alert(
        "Availability Error",
        err instanceof Error ? err.message : "Failed to update availability"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          isOnline ? styles.toggleOnline : styles.toggleOffline,
          !isEligible && !isOnline && styles.toggleDisabled,
        ]}
        onPress={handleToggle}
        disabled={isUpdating}
        activeOpacity={0.85}
      >
        {isUpdating ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.toggleContent}>
            <View
              style={[
                styles.statusDot,
                isOnline ? styles.statusDotOnline : styles.statusDotOffline,
              ]}
            />
            <Text style={styles.toggleText}>
              {isOnline ? "YOU ARE ONLINE • ACCEPTING DISPATCHES" : "YOU ARE OFFLINE • TAP TO GO ONLINE"}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: BRAND_COLORS.neutral.canvasDark,
  },
  toggleButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  toggleOnline: {
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    borderWidth: 1.5,
    borderColor: "#10B981",
  },
  toggleOffline: {
    backgroundColor: "#1E293B",
    borderWidth: 1.5,
    borderColor: "#334155",
  },
  toggleDisabled: {
    opacity: 0.6,
  },
  toggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotOnline: {
    backgroundColor: "#10B981",
  },
  statusDotOffline: {
    backgroundColor: "#94A3B8",
  },
  toggleText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
