import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { BRAND_COLORS } from "@kekego/shared";
import {
  NASARAWA_LANDMARKS,
  validateServiceArea,
  type LandmarkLocation,
} from "../services/location";

interface LocationModalProps {
  visible: boolean;
  currentPickupAddress: string;
  onClose: () => void;
  onSelectDestination: (destination: LandmarkLocation) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  visible,
  currentPickupAddress,
  onClose,
  onSelectDestination,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<"All" | "Lafia" | "Keffi" | "Karu">("All");

  const filteredLandmarks = NASARAWA_LANDMARKS.filter((item) => {
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === "All" || item.city === selectedCity;
    return matchesQuery && matchesCity;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Destination</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Pickup & Destination Inputs Box */}
        <View style={styles.inputCard}>
          {/* Pickup row */}
          <View style={styles.inputRow}>
            <View style={styles.greenDot} />
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>PICKUP LOCATION</Text>
              <Text style={styles.pickupStaticText} numberOfLines={1}>
                {currentPickupAddress}
              </Text>
            </View>
          </View>

          <View style={styles.dividerLine} />

          {/* Destination row */}
          <View style={styles.inputRow}>
            <View style={styles.amberSquare} />
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>WHERE TO?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Search market, school, hospital..."
                placeholderTextColor={BRAND_COLORS.neutral.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Text style={styles.clearSearchText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* City Filter Tabs */}
        <View style={styles.cityTabs}>
          {(["All", "Lafia", "Keffi", "Karu"] as const).map((city) => {
            const isSelected = selectedCity === city;
            return (
              <TouchableOpacity
                key={city}
                style={[styles.cityTab, isSelected && styles.cityTabActive]}
                onPress={() => setSelectedCity(city)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cityTabText,
                    isSelected && styles.cityTabTextActive,
                  ]}
                >
                  {city}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Landmarks / Search Results */}
        <ScrollView
          style={styles.resultsList}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionHeader}>
            {searchQuery ? "Search Results" : "Popular Nasarawa Landmarks"}
          </Text>

          {filteredLandmarks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📍</Text>
              <Text style={styles.emptyTitle}>No matching landmarks found</Text>
              <Text style={styles.emptySubtitle}>
                Try searching for "Market", "University", or choose from the city tabs.
              </Text>
            </View>
          ) : (
            filteredLandmarks.map((landmark) => {
              const validation = validateServiceArea(
                landmark.latitude,
                landmark.longitude
              );

              return (
                <TouchableOpacity
                  key={landmark.id}
                  style={styles.landmarkCard}
                  onPress={() => {
                    onSelectDestination(landmark);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.landmarkIconCircle}>
                    <Text style={styles.landmarkEmoji}>
                      {landmark.category === "market"
                        ? "🛒"
                        : landmark.category === "campus"
                        ? "🎓"
                        : landmark.category === "hospital"
                        ? "🏥"
                        : "📍"}
                    </Text>
                  </View>

                  <View style={styles.landmarkInfo}>
                    <View style={styles.landmarkNameRow}>
                      <Text style={styles.landmarkName}>{landmark.name}</Text>
                      <View style={styles.cityBadge}>
                        <Text style={styles.cityBadgeText}>{landmark.city}</Text>
                      </View>
                    </View>
                    <Text style={styles.landmarkAddress} numberOfLines={1}>
                      {landmark.address}
                    </Text>
                    {validation.isSupported ? (
                      <Text style={styles.coverageSupportedText}>
                        ✓ Within {validation.zoneName}
                      </Text>
                    ) : (
                      <Text style={styles.coverageWarningText}>
                        ⚠ {validation.message}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
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
  inputCard: {
    margin: 16,
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BRAND_COLORS.status.success,
    marginRight: 12,
  },
  amberSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pickupStaticText: {
    fontSize: 14,
    color: BRAND_COLORS.neutral.textPrimary,
    fontWeight: "600",
  },
  textInput: {
    fontSize: 15,
    color: BRAND_COLORS.neutral.textPrimary,
    fontWeight: "600",
    paddingVertical: 2,
  },
  clearSearchText: {
    color: BRAND_COLORS.primary.active,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
  },
  dividerLine: {
    height: 1,
    backgroundColor: BRAND_COLORS.neutral.borderLight,
    marginVertical: 12,
    marginLeft: 24,
  },
  cityTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  cityTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
  },
  cityTabActive: {
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    borderColor: BRAND_COLORS.primary.hover,
  },
  cityTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND_COLORS.neutral.textMuted,
  },
  cityTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  landmarkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
  },
  landmarkIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  landmarkEmoji: {
    fontSize: 20,
  },
  landmarkInfo: {
    flex: 1,
  },
  landmarkNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  landmarkName: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
    flex: 1,
  },
  cityBadge: {
    backgroundColor: BRAND_COLORS.secondary.subtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  cityBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: BRAND_COLORS.secondary.DEFAULT,
  },
  landmarkAddress: {
    fontSize: 12,
    color: BRAND_COLORS.neutral.textMuted,
    marginBottom: 4,
  },
  coverageSupportedText: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND_COLORS.status.success,
  },
  coverageWarningText: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND_COLORS.status.warning,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 40,
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
});
