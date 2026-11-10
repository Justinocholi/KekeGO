import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { BRAND_COLORS } from "@kekego/shared";

interface RadarMatchingModalProps {
  visible: boolean;
  rideNumber: string;
  onCancel: () => Promise<void>;
  isCancelling: boolean;
}

export const RadarMatchingModal: React.FC<RadarMatchingModalProps> = ({
  visible,
  rideNumber,
  onCancel,
  isCancelling,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(15);

  // Radar pulse animations
  const radarScale1 = useRef(new Animated.Value(0.2)).current;
  const radarOpacity1 = useRef(new Animated.Value(1)).current;
  const radarScale2 = useRef(new Animated.Value(0.2)).current;
  const radarOpacity2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      setSecondsRemaining(15);
      return;
    }

    // 15s Countdown
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Pulse 1
    const anim1 = Animated.loop(
      Animated.parallel([
        Animated.timing(radarScale1, {
          toValue: 2.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(radarOpacity1, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse 2 (staggered)
    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.parallel([
          Animated.timing(radarScale2, {
            toValue: 2.2,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(radarOpacity2, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    anim1.start();
    anim2.start();

    return () => {
      clearInterval(timer);
      anim1.stop();
      anim2.stop();
    };
  }, [visible, radarScale1, radarOpacity1, radarScale2, radarOpacity2]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        <View style={styles.contentCard}>
          {/* Top Tag */}
          <View style={styles.topTag}>
            <Text style={styles.topTagText}>RIDE REQUEST: {rideNumber}</Text>
          </View>

          {/* Sonar Radar Canvas */}
          <View style={styles.radarContainer}>
            <Animated.View
              style={[
                styles.radarWave,
                {
                  transform: [{ scale: radarScale1 }],
                  opacity: radarOpacity1,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.radarWave,
                {
                  transform: [{ scale: radarScale2 }],
                  opacity: radarOpacity2,
                },
              ]}
            />
            <View style={styles.radarCenter}>
              <Text style={styles.radarCenterIcon}>🛺</Text>
            </View>
          </View>

          {/* Headline & Countdown */}
          <Text style={styles.matchingHeadline}>
            Contacting nearby drivers...
          </Text>
          <Text style={styles.matchingSub}>
            Connecting with verified tricycles within your sector.
          </Text>

          {/* Timer Display */}
          <View style={styles.timerBadge}>
            <Text style={styles.timerLabel}>DISPATCH WINDOW</Text>
            <Text style={styles.timerNumber}>{secondsRemaining}s</Text>
          </View>

          {/* Cancel Request Button */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            disabled={isCancelling}
            activeOpacity={0.8}
          >
            {isCancelling ? (
              <ActivityIndicator color={BRAND_COLORS.status.error} />
            ) : (
              <Text style={styles.cancelBtnText}>Cancel Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 16,
  },
  contentCard: {
    width: "100%",
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    elevation: 8,
  },
  topTag: {
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    marginBottom: 20,
  },
  topTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textMuted,
  },
  radarContainer: {
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
  },
  radarWave: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(245, 158, 11, 0.25)",
    borderWidth: 2,
    borderColor: BRAND_COLORS.primary.DEFAULT,
  },
  radarCenter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  radarCenterIcon: {
    fontSize: 26,
  },
  matchingHeadline: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  matchingSub: {
    fontSize: 13,
    color: BRAND_COLORS.neutral.textMuted,
    textAlign: "center",
    marginBottom: 16,
    maxWidth: 260,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    marginBottom: 20,
    gap: 8,
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textMuted,
  },
  timerNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: BRAND_COLORS.primary.active,
  },
  cancelBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#FEE2E2", // soft red
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cancelBtnText: {
    color: BRAND_COLORS.status.error,
    fontWeight: "700",
    fontSize: 14,
  },
});
