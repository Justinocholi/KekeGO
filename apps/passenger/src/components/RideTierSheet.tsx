import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { BRAND_COLORS, RideTier, PaymentMethod } from "@kekego/shared";
import type { RideEstimateItem } from "../services/api";

interface RideTierSheetProps {
  estimates: RideEstimateItem[];
  isLoadingEstimates: boolean;
  selectedTier: RideTier;
  onSelectTier: (tier: RideTier) => void;
  onRequestRide: (paymentMethod: PaymentMethod) => void;
  isSubmitting: boolean;
  onCancelSelection: () => void;
}

export const RideTierSheet: React.FC<RideTierSheetProps> = ({
  estimates,
  isLoadingEstimates,
  selectedTier,
  onSelectTier,
  onRequestRide,
  isSubmitting,
  onCancelSelection,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );

  const tierMetadata: Record<
    RideTier,
    { title: string; subtitle: string; icon: string; capacity: string }
  > = {
    [RideTier.STANDARD]: {
      title: "Standard Keke",
      subtitle: "Everyday transport, shared or solo",
      icon: "🛺",
      capacity: "1-3 passengers",
    },
    [RideTier.CHARTER]: {
      title: "Keke Charter",
      subtitle: "Exclusive direct trip, zero stops",
      icon: "⭐",
      capacity: "Private exclusive",
    },
    [RideTier.CARGO]: {
      title: "Keke Cargo",
      subtitle: "Market parcels & goods haulage",
      icon: "📦",
      capacity: "Up to 100kg",
    },
  };

  const currentEstimate = estimates.find((e) => e.tier === selectedTier);
  const fareKobo = currentEstimate?.fareBreakdown.totalFareKobo ?? 0;
  const fareNaira = Math.round(fareKobo / 100).toLocaleString("en-NG");

  return (
    <View style={styles.sheetContainer}>
      {/* Top Grab Bar & Dismiss Button */}
      <View style={styles.headerRow}>
        <View style={styles.grabBar} />
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={onCancelSelection}
          activeOpacity={0.7}
        >
          <Text style={styles.dismissBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sheetTitle}>Choose your ride category</Text>

      {/* Tier Selection Cards */}
      {isLoadingEstimates ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={BRAND_COLORS.primary.DEFAULT} />
          <Text style={styles.loadingText}>Calculating live fares in Nasarawa...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.tierList}
        >
          {[RideTier.STANDARD, RideTier.CHARTER, RideTier.CARGO].map((tier) => {
            const isSelected = selectedTier === tier;
            const meta = tierMetadata[tier];
            const est = estimates.find((e) => e.tier === tier);
            const priceNaira = est
              ? Math.round(est.fareBreakdown.totalFareKobo / 100).toLocaleString("en-NG")
              : "---";

            return (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.tierCard,
                  isSelected && styles.tierCardSelected,
                ]}
                onPress={() => onSelectTier(tier)}
                activeOpacity={0.8}
              >
                <View style={styles.tierIconContainer}>
                  <Text style={styles.tierIcon}>{meta.icon}</Text>
                </View>

                <View style={styles.tierInfo}>
                  <View style={styles.tierTitleRow}>
                    <Text
                      style={[
                        styles.tierTitle,
                        isSelected && styles.tierTitleSelected,
                      ]}
                    >
                      {meta.title}
                    </Text>
                    <Text style={styles.tierPrice}>₦{priceNaira}</Text>
                  </View>

                  <Text style={styles.tierSubtitle}>{meta.subtitle}</Text>

                  <View style={styles.tierMetaRow}>
                    <Text style={styles.tierCapacity}>{meta.capacity}</Text>
                    {est && (
                      <Text style={styles.tierEta}>
                        • ~{est.estimatedDurationMinutes} mins
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Payment Method Selector */}
      <View style={styles.paymentSection}>
        <Text style={styles.paymentSectionTitle}>Payment Method</Text>
        <View style={styles.paymentChipsRow}>
          {[
            { id: PaymentMethod.CASH, label: "Cash", icon: "💵" },
            { id: PaymentMethod.WALLET, label: "Wallet (₦)", icon: "👛" },
            { id: PaymentMethod.CARD, label: "Card", icon: "💳" },
            { id: PaymentMethod.BANK_TRANSFER, label: "Transfer", icon: "🏦" },
          ].map((item) => {
            const isSelected = paymentMethod === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.paymentChip,
                  isSelected && styles.paymentChipSelected,
                ]}
                onPress={() => setPaymentMethod(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.paymentChipIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.paymentChipLabel,
                    isSelected && styles.paymentChipLabelSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Primary Booking Button */}
      <TouchableOpacity
        style={[styles.bookBtn, isSubmitting && styles.bookBtnDisabled]}
        onPress={() => onRequestRide(paymentMethod)}
        disabled={isSubmitting || isLoadingEstimates}
        activeOpacity={0.85}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <View style={styles.bookBtnContent}>
            <Text style={styles.bookBtnText}>
              Book {tierMetadata[selectedTier].title}
            </Text>
            <Text style={styles.bookBtnPrice}>₦{fareNaira}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.neutral.borderLight,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 24,
    marginBottom: 4,
  },
  grabBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BRAND_COLORS.neutral.borderLight,
  },
  dismissBtn: {
    position: "absolute",
    right: 0,
    top: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textMuted,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textPrimary,
    marginBottom: 12,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: BRAND_COLORS.neutral.textMuted,
    fontWeight: "600",
  },
  tierList: {
    maxHeight: 220,
  },
  tierCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.neutral.borderLight,
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    marginBottom: 8,
  },
  tierCardSelected: {
    borderColor: BRAND_COLORS.primary.DEFAULT,
    backgroundColor: "#FFFBEB", // subtle amber tint
  },
  tierIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tierIcon: {
    fontSize: 22,
  },
  tierInfo: {
    flex: 1,
  },
  tierTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
  },
  tierTitleSelected: {
    color: BRAND_COLORS.primary.active,
  },
  tierPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textPrimary,
  },
  tierSubtitle: {
    fontSize: 11,
    color: BRAND_COLORS.neutral.textMuted,
    marginBottom: 2,
  },
  tierMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tierCapacity: {
    fontSize: 10,
    fontWeight: "600",
    color: BRAND_COLORS.secondary.DEFAULT,
  },
  tierEta: {
    fontSize: 10,
    color: BRAND_COLORS.neutral.textMuted,
    marginLeft: 4,
  },
  paymentSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  paymentSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textMuted,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  paymentChipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  paymentChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    gap: 4,
  },
  paymentChipSelected: {
    borderColor: BRAND_COLORS.secondary.DEFAULT,
    backgroundColor: BRAND_COLORS.secondary.subtle,
  },
  paymentChipIcon: {
    fontSize: 12,
  },
  paymentChipLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND_COLORS.neutral.textMuted,
  },
  paymentChipLabelSelected: {
    color: BRAND_COLORS.secondary.DEFAULT,
    fontWeight: "700",
  },
  bookBtn: {
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: BRAND_COLORS.primary.active,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  bookBtnDisabled: {
    opacity: 0.7,
  },
  bookBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  bookBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  bookBtnPrice: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
