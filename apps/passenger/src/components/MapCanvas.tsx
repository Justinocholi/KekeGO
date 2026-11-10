import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  type DimensionValue,
} from "react-native";
import { BRAND_COLORS } from "@kekego/shared";
import { type NearbyKekeMarker } from "../services/location";

interface MapCanvasProps {
  pickup: { latitude: number; longitude: number; address: string };
  destination: { latitude: number; longitude: number; address: string } | null;
  nearbyDrivers: NearbyKekeMarker[];
  activeZoneName: string;
  onSelectMapPoint?: (point: { latitude: number; longitude: number }) => void;
  onRecenter?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const MapCanvas: React.FC<MapCanvasProps> = ({
  pickup,
  destination,
  nearbyDrivers,
  activeZoneName,
  onRecenter,
}) => {
  // Pulsing animation for pickup location marker
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Visual Road Network Canvas */}
      <View style={styles.gridOverlay}>
        {/* Major thoroughfares representation */}
        <View style={styles.roadHorizontal1} />
        <View style={styles.roadHorizontal2} />
        <View style={styles.roadVertical1} />
        <View style={styles.roadVertical2} />
        <View style={styles.roundaboutCircle} />

        {/* Operational Zone Watermark / Ribbon */}
        <View style={styles.zonePill}>
          <View style={styles.zoneDot} />
          <Text style={styles.zoneText}>{activeZoneName}</Text>
        </View>

        {/* Route Line if destination is selected */}
        {destination && (
          <View style={styles.routeContainer}>
            <View style={styles.routePolyline} />
            <View style={styles.routeBadge}>
              <Text style={styles.routeBadgeText}>3.8 km • ~11 mins</Text>
            </View>
          </View>
        )}

        {/* Nearby Active Tricycles */}
        {nearbyDrivers.map((driver, index) => {
          // Offsets for mock spatial distribution
          const offsets: Array<{
            top?: DimensionValue;
            left?: DimensionValue;
            right?: DimensionValue;
            bottom?: DimensionValue;
          }> = [
            { top: "25%", left: "20%" },
            { top: "35%", right: "22%" },
            { bottom: "38%", left: "28%" },
            { bottom: "28%", right: "25%" },
          ];
          const pos = offsets[index % offsets.length];

          return (
            <View key={driver.id} style={[styles.kekeMarkerContainer, pos]}>
              <View style={styles.kekeVehicleBody}>
                <Text style={styles.kekeIcon}>🛺</Text>
              </View>
              <View style={styles.callsignPill}>
                <Text style={styles.callsignText}>{driver.callSign}</Text>
              </View>
            </View>
          );
        })}

        {/* Pickup Pin with Pulse Effect */}
        <View style={styles.pickupPinContainer}>
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <View style={styles.pickupPinCore}>
            <View style={styles.pickupPinCenterDot} />
          </View>
          <View style={styles.pickupAddressTag}>
            <Text style={styles.pickupTagLabel}>PICKUP</Text>
            <Text style={styles.pickupTagAddress} numberOfLines={1}>
              {pickup.address.split(",")[0]}
            </Text>
          </View>
        </View>

        {/* Destination Pin if selected */}
        {destination && (
          <View style={styles.destinationPinContainer}>
            <View style={styles.destinationPinCore}>
              <Text style={styles.destinationIcon}>🏁</Text>
            </View>
            <View style={styles.destinationAddressTag}>
              <Text style={styles.destTagLabel}>DESTINATION</Text>
              <Text style={styles.destTagAddress} numberOfLines={1}>
                {destination.address.split(",")[0]}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Recenter / GPS Floating Button */}
      <TouchableOpacity
        style={styles.recenterBtn}
        onPress={onRecenter}
        activeOpacity={0.8}
      >
        <Text style={styles.recenterIcon}>🎯</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
    position: "relative",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  roadHorizontal1: {
    position: "absolute",
    top: "35%",
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: "#E2E8F0",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#CBD5E1",
  },
  roadHorizontal2: {
    position: "absolute",
    top: "65%",
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: "#E2E8F0",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#CBD5E1",
  },
  roadVertical1: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "35%",
    width: 20,
    backgroundColor: "#E2E8F0",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#CBD5E1",
  },
  roadVertical2: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: "30%",
    width: 16,
    backgroundColor: "#E2E8F0",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#CBD5E1",
  },
  roundaboutCircle: {
    position: "absolute",
    top: "45%",
    left: "40%",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F8FAFC",
    borderWidth: 6,
    borderColor: "#CBD5E1",
  },
  zonePill: {
    position: "absolute",
    top: 14,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  zoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_COLORS.status.success,
    marginRight: 6,
  },
  zoneText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  kekeMarkerContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  kekeVehicleBody: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  kekeIcon: {
    fontSize: 20,
  },
  callsignPill: {
    marginTop: 2,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  callsignText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  pickupPinContainer: {
    position: "absolute",
    top: "52%",
    left: "44%",
    alignItems: "center",
  },
  pulseCircle: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(16, 185, 129, 0.25)",
  },
  pickupPinCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  pickupPinCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  pickupAddressTag: {
    marginTop: 4,
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 140,
    alignItems: "center",
  },
  pickupTagLabel: {
    color: BRAND_COLORS.secondary.subtle,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  pickupTagAddress: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  destinationPinContainer: {
    position: "absolute",
    top: "22%",
    right: "26%",
    alignItems: "center",
  },
  destinationPinCore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  destinationIcon: {
    fontSize: 16,
  },
  destinationAddressTag: {
    marginTop: 4,
    backgroundColor: BRAND_COLORS.neutral.textPrimary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 140,
    alignItems: "center",
  },
  destTagLabel: {
    color: BRAND_COLORS.primary.DEFAULT,
    fontSize: 8,
    fontWeight: "800",
  },
  destTagAddress: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  routeContainer: {
    position: "absolute",
    top: "32%",
    left: "48%",
    alignItems: "center",
  },
  routePolyline: {
    width: 2,
    height: 90,
    backgroundColor: BRAND_COLORS.primary.active,
    borderStyle: "dashed",
  },
  routeBadge: {
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.primary.DEFAULT,
    elevation: 3,
    marginTop: -50,
  },
  routeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.primary.active,
  },
  recenterBtn: {
    position: "absolute",
    bottom: 24,
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  recenterIcon: {
    fontSize: 22,
  },
});
