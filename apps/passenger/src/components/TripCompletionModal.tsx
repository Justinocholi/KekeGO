import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { BRAND_COLORS } from "@kekego/shared";
import type { ActiveRide } from "../services/api";

interface TripCompletionModalProps {
  visible: boolean;
  ride: ActiveRide | null;
  onSubmitRating: (score: number, comment?: string, tags?: string[]) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

export const TripCompletionModal: React.FC<TripCompletionModalProps> = ({
  visible,
  ride,
  onSubmitRating,
  onClose,
  isSubmitting,
}) => {
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Smooth ride",
    "Polite driver",
  ]);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);

  if (!ride) return null;

  const fareKobo = ride.finalFareKobo || ride.estimatedFareKobo;
  const fareNaira = Math.round(fareKobo / 100).toLocaleString("en-NG");

  const availableTags = [
    "Smooth ride",
    "Polite driver",
    "Safe speed",
    "Clean keke",
    "Punctual",
    "Fair pricing",
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    await onSubmitRating(
      ratingScore,
      comment.trim() ? comment.trim() : undefined,
      selectedTags
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetCard}>
          {/* Header */}
          <View style={styles.congratsBadge}>
            <Text style={styles.congratsEmoji}>🎉</Text>
          </View>
          <Text style={styles.title}>You have arrived!</Text>
          <Text style={styles.subtitle}>
            Trip {ride.rideNumber} completed successfully
          </Text>

          {/* Fare Summary Card */}
          <View style={styles.fareCard}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Total Fare Paid</Text>
              <Text style={styles.fareAmount}>₦{fareNaira}</Text>
            </View>
            <View style={styles.fareDivider} />
            <View style={styles.fareDetailRow}>
              <Text style={styles.fareDetailLabel}>Payment Method</Text>
              <Text style={styles.fareDetailValue}>{ride.paymentMethod}</Text>
            </View>
            <View style={styles.fareDetailRow}>
              <Text style={styles.fareDetailLabel}>Driver</Text>
              <Text style={styles.fareDetailValue}>
                {ride.driver?.name || "Kekego Driver"}
              </Text>
            </View>
          </View>

          {/* Star Rating Section */}
          <Text style={styles.ratingHeading}>Rate your driver</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRatingScore(star)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.starItem,
                    star <= ratingScore && styles.starItemActive,
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Feedback Tags */}
          <View style={styles.tagsContainer}>
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, isSelected && styles.tagChipActive]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tagText,
                      isSelected && styles.tagTextActive,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Optional Tip Selector */}
          <View style={styles.tipSection}>
            <Text style={styles.tipLabel}>Add driver tip (optional)</Text>
            <View style={styles.tipRow}>
              {[100, 200, 500].map((amount) => {
                const isSelected = selectedTip === amount;
                return (
                  <TouchableOpacity
                    key={amount}
                    style={[styles.tipChip, isSelected && styles.tipChipActive]}
                    onPress={() =>
                      setSelectedTip(isSelected ? null : amount)
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tipText,
                        isSelected && styles.tipTextActive,
                      ]}
                    >
                      +₦{amount}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Comment TextInput */}
          <TextInput
            style={styles.commentInput}
            placeholder="Add comments or compliments..."
            placeholderTextColor={BRAND_COLORS.neutral.textMuted}
            value={comment}
            onChangeText={setComment}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Rating & Finish</Text>
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
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: "center",
  },
  congratsBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND_COLORS.primary.subtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  congratsEmoji: {
    fontSize: 26,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: BRAND_COLORS.neutral.textMuted,
    marginBottom: 16,
  },
  fareCard: {
    width: "100%",
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    marginBottom: 16,
  },
  fareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fareLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND_COLORS.neutral.textMuted,
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: BRAND_COLORS.neutral.textPrimary,
  },
  fareDivider: {
    height: 1,
    backgroundColor: BRAND_COLORS.neutral.borderLight,
    marginVertical: 10,
  },
  fareDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  fareDetailLabel: {
    fontSize: 12,
    color: BRAND_COLORS.neutral.textMuted,
  },
  fareDetailValue: {
    fontSize: 12,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
  },
  ratingHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  starItem: {
    fontSize: 32,
    color: BRAND_COLORS.neutral.borderLight,
  },
  starItemActive: {
    color: BRAND_COLORS.primary.DEFAULT,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
  },
  tagChipActive: {
    backgroundColor: BRAND_COLORS.primary.subtle,
    borderColor: BRAND_COLORS.primary.DEFAULT,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND_COLORS.neutral.textMuted,
  },
  tagTextActive: {
    color: BRAND_COLORS.primary.active,
    fontWeight: "700",
  },
  tipSection: {
    width: "100%",
    marginBottom: 12,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textMuted,
    marginBottom: 6,
  },
  tipRow: {
    flexDirection: "row",
    gap: 8,
  },
  tipChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    alignItems: "center",
  },
  tipChipActive: {
    backgroundColor: BRAND_COLORS.secondary.subtle,
    borderColor: BRAND_COLORS.secondary.DEFAULT,
  },
  tipText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.neutral.textMuted,
  },
  tipTextActive: {
    color: BRAND_COLORS.secondary.DEFAULT,
    fontWeight: "800",
  },
  commentInput: {
    width: "100%",
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: BRAND_COLORS.neutral.textPrimary,
    marginBottom: 16,
  },
  submitBtn: {
    width: "100%",
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
