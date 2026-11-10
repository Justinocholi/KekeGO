import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { BRAND_COLORS } from "@kekego/shared";
import { api, type RideHistoryItem } from "../services/api";

interface TripHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TripHistoryModal: React.FC<TripHistoryModalProps> = ({
  visible,
  onClose,
}) => {
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.getRideHistory(1, 20);
        setRides(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [visible]);

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
          <Text style={styles.headerTitle}>Trip History</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={BRAND_COLORS.primary.DEFAULT} />
            <Text style={styles.loadingText}>Fetching your rides...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Unable to load history</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : rides.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyIcon}>🛺</Text>
            <Text style={styles.emptyTitle}>No past trips yet</Text>
            <Text style={styles.emptySubtitle}>
              When you take rides across Lafia, Keffi, or Karu, they will appear here.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          >
            {rides.map((ride) => {
              const fareNaira = Math.round(ride.fareKobo / 100).toLocaleString("en-NG");
              const isCompleted = ride.status === "COMPLETED";

              return (
                <View key={ride.id} style={styles.rideCard}>
                  {/* Top line: Ride Number, Status & Date */}
                  <View style={styles.rideCardHeader}>
                    <View style={styles.rideHeaderLeft}>
                      <Text style={styles.rideNumber}>{ride.rideNumber}</Text>
                      <View style={styles.tierTag}>
                        <Text style={styles.tierTagText}>{ride.tier}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        isCompleted
                          ? styles.statusCompleted
                          : styles.statusCancelled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isCompleted
                            ? styles.statusCompletedText
                            : styles.statusCancelledText,
                        ]}
                      >
                        {ride.status}
                      </Text>
                    </View>
                  </View>

                  {/* Route points */}
                  <View style={styles.routeContainer}>
                    <View style={styles.pointRow}>
                      <View style={styles.greenDot} />
                      <Text style={styles.pointText} numberOfLines={1}>
                        {ride.pickupAddress}
                      </Text>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.pointRow}>
                      <View style={styles.amberSquare} />
                      <Text style={styles.pointText} numberOfLines={1}>
                        {ride.destinationAddress}
                      </Text>
                    </View>
                  </View>

                  {/* Footer: Driver & Fare */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.driverText}>
                      {ride.driverName
                        ? `Driver: ${ride.driverName}`
                        : "No driver assigned"}
                    </Text>
                    <Text style={styles.fareText}>₦{fareNaira}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
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
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: BRAND_COLORS.neutral.textMuted,
    fontWeight: "600",
  },
  errorIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: BRAND_COLORS.status.error,
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: BRAND_COLORS.neutral.textMuted,
    textAlign: "center",
    maxWidth: 240,
  },
  list: {
    flex: 1,
  },
  rideCard: {
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    elevation: 1,
  },
  rideCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  rideHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rideNumber: {
    fontSize: 13,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textPrimary,
  },
  tierTag: {
    backgroundColor: BRAND_COLORS.primary.subtle,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tierTagText: {
    fontSize: 9,
    fontWeight: "800",
    color: BRAND_COLORS.primary.active,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: BRAND_COLORS.secondary.subtle,
  },
  statusCompletedText: {
    color: BRAND_COLORS.secondary.DEFAULT,
    fontSize: 10,
    fontWeight: "700",
  },
  statusCancelled: {
    backgroundColor: "#FEE2E2",
  },
  statusCancelledText: {
    color: BRAND_COLORS.status.error,
    fontSize: 10,
    fontWeight: "700",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  routeContainer: {
    marginVertical: 4,
    paddingLeft: 4,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "center",
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
  pointText: {
    fontSize: 12,
    color: BRAND_COLORS.neutral.textPrimary,
    fontWeight: "500",
    flex: 1,
  },
  routeLine: {
    width: 1,
    height: 12,
    backgroundColor: BRAND_COLORS.neutral.borderLight,
    marginLeft: 3.5,
    marginVertical: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.neutral.borderLight,
    paddingTop: 8,
    marginTop: 8,
  },
  driverText: {
    fontSize: 11,
    color: BRAND_COLORS.neutral.textMuted,
  },
  fareText: {
    fontSize: 13,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textPrimary,
  },
});
