import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { BRAND_COLORS } from "@kekego/shared";

interface EarningsHUDProps {
  netEarningsKobo: number;
  completedTrips: number;
  acceptanceRatePercent: number;
  driverRating: number;
  onPress: () => void;
}

export const EarningsHUD: React.FC<EarningsHUDProps> = ({
  netEarningsKobo,
  completedTrips,
  acceptanceRatePercent,
  driverRating,
  onPress,
}) => {
  const netEarningsNaira = Math.round(netEarningsKobo / 100).toLocaleString(
    "en-NG"
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.hudLabel}>TODAY'S NET EARNINGS</Text>
          <Text style={styles.earningsAmount}>₦{netEarningsNaira}</Text>
        </View>
        <View style={styles.detailsBadge}>
          <Text style={styles.detailsText}>Ledger ›</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metricsRow}>
        <View style={styles.metricCol}>
          <Text style={styles.metricValue}>{completedTrips}</Text>
          <Text style={styles.metricLabel}>Trips Done</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricCol}>
          <Text style={styles.metricValue}>{acceptanceRatePercent}%</Text>
          <Text style={styles.metricLabel}>Acceptance</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricCol}>
          <Text style={styles.metricValue}>
            ★ {Number(driverRating).toFixed(1)}
          </Text>
          <Text style={styles.metricLabel}>Rating</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderDark,
    elevation: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hudLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textMutedDark,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: "900",
    color: BRAND_COLORS.primary.DEFAULT,
  },
  detailsBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: BRAND_COLORS.neutral.borderDark,
    marginVertical: 10,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metricCol: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textLight,
    marginBottom: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: BRAND_COLORS.neutral.textMutedDark,
    fontWeight: "600",
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: BRAND_COLORS.neutral.borderDark,
  },
});
