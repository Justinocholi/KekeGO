import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { BRAND_COLORS } from "@kekego/shared";

interface StartOtpModalProps {
  visible: boolean;
  passengerName: string;
  onVerifyAndStart: (startOtp: string) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

export const StartOtpModal: React.FC<StartOtpModalProps> = ({
  visible,
  passengerName,
  onVerifyAndStart,
  onClose,
  isSubmitting,
}) => {
  const [otpInput, setOtpInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async () => {
    setErrorMessage(null);
    const cleaned = otpInput.trim();
    if (cleaned.length !== 4) {
      setErrorMessage("Please enter all 4 digits of passenger's start OTP");
      return;
    }

    try {
      await onVerifyAndStart(cleaned);
      setOtpInput("");
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Invalid boarding OTP"
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.lockBadge}>
            <Text style={styles.lockIcon}>🔐</Text>
          </View>

          <Text style={styles.title}>Boarding Verification</Text>
          <Text style={styles.subtitle}>
            Ask passenger {passengerName} for their 4-digit start OTP before
            moving.
          </Text>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TextInput
            style={styles.otpInput}
            placeholder="••••"
            placeholderTextColor="#475569"
            keyboardType="number-pad"
            maxLength={4}
            value={otpInput}
            onChangeText={setOtpInput}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.verifyBtn, isSubmitting && styles.verifyBtnDisabled]}
            onPress={handleVerify}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyBtnText}>Verify & Start Trip</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
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
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderDark,
    elevation: 8,
  },
  lockBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  lockIcon: {
    fontSize: 26,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textLight,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: BRAND_COLORS.neutral.textMutedDark,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    width: "100%",
  },
  errorText: {
    color: BRAND_COLORS.status.error,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  otpInput: {
    width: "70%",
    height: 56,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BRAND_COLORS.primary.DEFAULT,
    fontSize: 28,
    fontWeight: "900",
    color: BRAND_COLORS.primary.DEFAULT,
    textAlign: "center",
    letterSpacing: 10,
    marginBottom: 20,
  },
  verifyBtn: {
    width: "100%",
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
    elevation: 3,
  },
  verifyBtnDisabled: {
    opacity: 0.7,
  },
  verifyBtnText: {
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
