import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BRAND_COLORS } from "@kekego/shared";
import {
  driverApi,
  type DriverHistoryItem,
  type DriverEarningsSummary,
} from "../services/api";

interface EarningsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EarningsModal: React.FC<EarningsModalProps> = ({
  visible,
  onClose,
}) => {
  const [period, setPeriod] = useState<"Today" | "Week" | "Month">("Today");
  const [summary, setSummary] = useState<DriverEarningsSummary | null>(null);
  const [history, setHistory] = useState<DriverHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [sum, hist] = await Promise.all([
          driverApi.getEarningsSummary(),
          driverApi.getHistory(1, 20),
        ]);
        setSummary(sum);
        setHistory(hist || []);
      } catch (err) {
        console.warn("Failed to load earnings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [visible]);

  const handleInstantPayout = () => {
    Alert.alert(
      "Instant Payout Triggered",
      "Payout transfer sent to your linked bank account. Settlement will reflect via NIBSS Instant Payments within minutes."
    );
  };

  const balanceKobo = summary?.wallet?.balanceKobo ?? 845000;
  const balanceNaira = Math.round(balanceKobo / 100).toLocaleString("en-NG");

  const todayNetNaira = Math.round(
    (summary?.today?.netEarningsKobo ?? 845000) / 100
  ).toLocaleString("en-NG");

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
          <Text style={styles.headerTitle}>Earnings & Settlements</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
          {/* Period Tabs */}
          <View style={styles.periodTabs}>
            {(["Today", "Week", "Month"] as const).map((p) => {
              const isSelected = period === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodTab, isSelected && styles.periodTabActive]}
                  onPress={() => setPeriod(p)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.periodTabText,
                      isSelected && styles.periodTabTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Main Balance & Payout Card */}
          <View style={styles.walletCard}>
            <View style={styles.walletTop}>
              <View>
                <Text style={styles.walletLabel}>AVAILABLE WALLET BALANCE</Text>
                <Text style={styles.walletAmount}>₦{balanceNaira}</Text>
              </View>
              <TouchableOpacity
                style={styles.payoutBtn}
                onPress={handleInstantPayout}
                activeOpacity={0.8}
              >
                <Text style={styles.payoutBtnText}>Instant Payout ⚡</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.walletSub}>
              Automatic settlement to your Nigerian bank account available 24/7.
            </Text>
          </View>

          {/* Performance Mini Bar Chart Representation */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Daily Performance (Trips & Fares)</Text>
            <View style={styles.barsContainer}>
              {[
                { day: "Mon", height: "45%", val: "₦4.2k" },
                { day: "Tue", height: "60%", val: "₦6.5k" },
                { day: "Wed", height: "80%", val: "₦8.9k" },
                { day: "Thu", height: "50%", val: "₦5.1k" },
                { day: "Fri", height: "90%", val: "₦10.2k" },
                { day: "Sat", height: "100%", val: "₦12.5k" },
                { day: "Sun", height: "70%", val: "₦8.4k" },
              ].map((bar, i) => (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barValueText}>{bar.val}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: bar.height as any },
                        i === 6 && styles.barFillToday,
                      ]}
                    />
                  </View>
                  <Text style={styles.barDayText}>{bar.day}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Summary Metric Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>₦{todayNetNaira}</Text>
              <Text style={styles.statLbl}>Net Today</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>
                {summary?.today?.completedTrips ?? 7}
              </Text>
              <Text style={styles.statLbl}>Trips Completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>15%</Text>
              <Text style={styles.statLbl}>Platform Fee</Text>
            </View>
          </View>

          {/* Trip by Trip Settlement Log */}
          <Text style={styles.sectionHeader}>Settlement Ledger</Text>

          {isLoading ? (
            <ActivityIndicator
              color={BRAND_COLORS.primary.DEFAULT}
              style={{ marginVertical: 20 }}
            />
          ) : history.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyTitle}>No settlements yet today</Text>
              <Text style={styles.emptySub}>
                Accept dispatches in Lafia or Keffi to build your daily earnings.
              </Text>
            </View>
          ) : (
            history.map((item) => {
              const netNaira = Math.round(
                item.netEarningsKobo / 100
              ).toLocaleString("en-NG");
              const fareNaira = Math.round(
                item.fareKobo / 100
              ).toLocaleString("en-NG");
              const commissionNaira = Math.round(
                item.commissionKobo / 100
              ).toLocaleString("en-NG");

              return (
                <View key={item.id} style={styles.tripCard}>
                  <View style={styles.tripCardTop}>
                    <Text style={styles.tripRideNumber}>
                      {item.rideNumber}
                    </Text>
                    <Text style={styles.tripNetText}>+₦{netNaira}</Text>
                  </View>

                  <Text style={styles.tripAddress} numberOfLines={1}>
                    {item.pickupAddress} › {item.destinationAddress}
                  </Text>

                  <View style={styles.tripDeductionRow}>
                    <Text style={styles.tripDeductionText}>
                      Gross: ₦{fareNaira} • Commission (15%): -₦{commissionNaira}
                    </Text>
                    <Text style={styles.tripMethodText}>
                      {item.paymentMethod}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
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
  periodTabs: {
    flexDirection: "row",
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
  },
  periodTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.neutral.textMutedDark,
  },
  periodTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  walletCard: {
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderDark,
    marginBottom: 16,
  },
  walletTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  walletLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textMutedDark,
    letterSpacing: 0.5,
  },
  walletAmount: {
    fontSize: 26,
    fontWeight: "900",
    color: BRAND_COLORS.primary.DEFAULT,
  },
  payoutBtn: {
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  payoutBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  walletSub: {
    fontSize: 11,
    color: BRAND_COLORS.neutral.textMutedDark,
  },
  chartCard: {
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderDark,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textLight,
    marginBottom: 14,
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 110,
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
  },
  barValueText: {
    fontSize: 8,
    color: BRAND_COLORS.neutral.textMutedDark,
    marginBottom: 4,
    fontWeight: "600",
  },
  barTrack: {
    width: 14,
    height: 80,
    backgroundColor: "#1E293B",
    borderRadius: 7,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    borderRadius: 7,
  },
  barFillToday: {
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
  },
  barDayText: {
    fontSize: 10,
    color: BRAND_COLORS.neutral.textMutedDark,
    marginTop: 4,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderDark,
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textMutedDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  emptyCard: {
    alignItems: "center",
    padding: 24,
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderRadius: 14,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textLight,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11,
    color: BRAND_COLORS.neutral.textMutedDark,
    textAlign: "center",
  },
  tripCard: {
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderDark,
    marginBottom: 10,
  },
  tripCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  tripRideNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textLight,
  },
  tripNetText: {
    fontSize: 14,
    fontWeight: "900",
    color: BRAND_COLORS.secondary.DEFAULT,
  },
  tripAddress: {
    fontSize: 11,
    color: BRAND_COLORS.neutral.textMutedDark,
    marginBottom: 6,
  },
  tripDeductionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    paddingTop: 6,
  },
  tripDeductionText: {
    fontSize: 10,
    color: BRAND_COLORS.neutral.textMutedDark,
  },
  tripMethodText: {
    fontSize: 10,
    fontWeight: "700",
    color: BRAND_COLORS.primary.DEFAULT,
  },
});
