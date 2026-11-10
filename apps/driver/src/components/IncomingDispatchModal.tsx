import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { BRAND_COLORS } from "@kekego/shared";
import type { DispatchItem } from "../services/api";

interface IncomingDispatchModalProps {
  dispatch: DispatchItem | null;
  onAccept: (dispatchId: string) => Promise<void>;
  onDecline: (dispatchId: string) => void;
  isAccepting: boolean;
}

export const IncomingDispatchModal: React.FC<IncomingDispatchModalProps> = ({
  dispatch,
  onAccept,
  onDecline,
  isAccepting,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(15);

  useEffect(() => {
    if (!dispatch) return;
    setSecondsRemaining(15);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline(dispatch.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatch, onDecline]);

  if (!dispatch) return null;

  const earningsNaira = Math.round(
    dispatch.estimatedEarningsKobo / 100
  ).toLocaleString("en-NG");
  const distanceKm = (dispatch.estimatedDistanceMeters / 1000).toFixed(1);
  const durationMins = Math.round(dispatch.estimatedDurationSeconds / 60);

  return (
    <Modal
      visible={!!dispatch}
      transparent
      animationType="slide"
      onRequestClose={() => onDecline(dispatch.id)}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetCard}>
          {/* Top Timer Bar */}
          <View style={styles.timerContainer}>
            <View style={styles.timerCircle}>
              <Text style={styles.timerNumber}>{secondsRemaining}s</Text>
            </View>
            <View style={styles.timerTextGroup}>
              <Text style={styles.incomingLabel}>INCOMING DISPATCH</Text>
              <Text style={styles.rideNumber}>{dispatch.rideNumber}</Text>
            </View>
            <View style={styles.tierTag}>
              <Text style={styles.tierTagText}>{dispatch.tier}</Text>
            </View>
          </View>

          {/* Earnings Display */}
          <View style={styles.earningsBanner}>
            <Text style={styles.earningsLabel}>YOUR ESTIMATED EARNINGS</Text>
            <Text style={styles.earningsValue}>₦{earningsNaira}</Text>
            <Text style={styles.earningsSub}>
              Net payout (15% platform commission deducted)
            </Text>
          </View>

          {/* Route & Passenger Rating */}
          <View style={styles.routeCard}>
            <View style={styles.passengerRow}>
              <Text style={styles.passengerRating}>
                ★ {Number(dispatch.passengerRating).toFixed(1)} Passenger
              </Text>
              <Text style={styles.distanceBadge}>
                {distanceKm} km • ~{durationMins} mins
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.pointRow}>
              <View style={styles.greenDot} />
              <View style={styles.pointInfo}>
                <Text style={styles.pointLabel}>PICKUP</Text>
                <Text style={styles.pointAddress} numberOfLines={1}>
                  {dispatch.pickupAddress}
                </Text>
              </View>
            </View>

            <View style={styles.pointRow}>
              <View style={styles.amberSquare} />
              <View style={styles.pointInfo}>
                <Text style={styles.pointLabel}>DESTINATION</Text>
                <Text style={styles.pointAddress} numberOfLines={1}>
                  {dispatch.destinationAddress}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.acceptBtn, isAccepting && styles.acceptBtnDisabled]}
            onPress={() => onAccept(dispatch.id)}
            disabled={isAccepting}
            activeOpacity={0.85}
          >
            {isAccepting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.acceptBtnText}>Accept Dispatch</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => onDecline(dispatch.id)}
            disabled={isAccepting}
            activeOpacity={0.7}
          >
            <Text style={styles.declineBtnText}>Decline / Pass to Next Keke</Text>
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
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 2,
    borderColor: BRAND_COLORS.secondary.DEFAULT,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  timerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  timerNumber: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  timerTextGroup: {
    flex: 1,
  },
  incomingLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: BRAND_COLORS.secondary.DEFAULT,
    letterSpacing: 0.5,
  },
  rideNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textLight,
  },
  tierTag: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BRAND_COLORS.primary.DEFAULT,
  },
  tierTagText: {
    color: BRAND_COLORS.primary.DEFAULT,
    fontSize: 10,
    fontWeight: "800",
  },
  earningsBanner: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  earningsLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textMutedDark,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: "900",
    color: BRAND_COLORS.secondary.DEFAULT,
    marginBottom: 2,
  },
  earningsSub: {
    fontSize: 10,
    color: BRAND_COLORS.neutral.textMutedDark,
  },
  routeCard: {
    backgroundColor: "#131B2E",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  passengerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  passengerRating: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.primary.DEFAULT,
  },
  distanceBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.neutral.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: "#1E293B",
    marginVertical: 8,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_COLORS.status.success,
    marginRight: 8,
  },
  amberSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    marginRight: 8,
  },
  pointInfo: {
    flex: 1,
  },
  pointLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textMutedDark,
  },
  pointAddress: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.neutral.textLight,
  },
  acceptBtn: {
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
    elevation: 4,
  },
  acceptBtnDisabled: {
    opacity: 0.7,
  },
  acceptBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  declineBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  declineBtnText: {
    color: BRAND_COLORS.neutral.textMutedDark,
    fontSize: 12,
    fontWeight: "700",
  },
});
