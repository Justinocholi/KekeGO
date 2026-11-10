import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  type DimensionValue,
} from "react-native";
import { BRAND_COLORS } from "@kekego/shared";
import { NASARAWA_DEMAND_HOTSPOTS } from "../services/heatmap";
import type { DriverActiveRide } from "../services/api";

interface CockpitMapProps {
  activeRide: DriverActiveRide | null;
  onRecenter: () => void;
}

export const CockpitMap: React.FC<CockpitMapProps> = ({
  activeRide,
  onRecenter,
}) => {
  return (
    <View style={styles.container}>
      {/* Dark Road Grid Overlay */}
      <View style={styles.roadHorizontal1} />
      <View style={styles.roadHorizontal2} />
      <View style={styles.roadVertical1} />
      <View style={styles.roadVertical2} />
      <View style={styles.roundaboutCircle} />

      {/* Demand Heatmap Overlays */}
      {!activeRide &&
        NASARAWA_DEMAND_HOTSPOTS.map((hotspot, idx) => {
          const positions: Array<{ top?: DimensionValue; left?: DimensionValue; right?: DimensionValue; bottom?: DimensionValue }> = [
            { top: "25%", left: "20%" },
            { top: "35%", right: "20%" },
            { bottom: "30%", left: "25%" },
            { bottom: "25%", right: "18%" },
          ];
          const pos = positions[idx % positions.length];
          const isHigh = hotspot.demandLevel === "SURGE_HIGH";

          return (
            <View key={hotspot.id} style={[styles.hotspotContainer, pos]}>
              <View
                style={[
                  styles.hotspotPulse,
                  isHigh ? styles.pulseHigh : styles.pulseNormal,
                ]}
              />
              <View
                style={[
                  styles.hotspotCore,
                  isHigh ? styles.coreHigh : styles.coreNormal,
                ]}
              >
                <Text style={styles.hotspotIcon}>
                  {isHigh ? "🔥" : "📍"}
                </Text>
              </View>
              <View style={styles.hotspotBadge}>
                <Text style={styles.hotspotBadgeText}>
                  {hotspot.name.split(" ")[0]} • {hotspot.surgeMultiplier}x
                </Text>
              </View>
            </View>
          );
        })}

      {/* Active Trip Route if active */}
      {activeRide && (
        <View style={styles.activeRouteContainer}>
          <View style={styles.routePolyline} />
          <View style={styles.routeBadge}>
            <Text style={styles.routeBadgeText}>
              Turn right onto Makurdi Rd in 200m
            </Text>
          </View>
        </View>
      )}

      {/* Driver Tricycle Center Marker */}
      <View style={styles.kekeDriverMarker}>
        <View style={styles.driverPulseRing} />
        <View style={styles.kekeVehicleBody}>
          <Text style={styles.kekeIcon}>🛺</Text>
        </View>
        <View style={styles.speedPill}>
          <Text style={styles.speedText}>24 km/h</Text>
        </View>
      </View>

      {/* Recenter Button */}
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
    backgroundColor: "#0B1120", // Deep Night Navigation
    overflow: "hidden",
    position: "relative",
  },
  roadHorizontal1: {
    position: "absolute",
    top: "35%",
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: "#1E293B",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#334155",
  },
  roadHorizontal2: {
    position: "absolute",
    top: "65%",
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: "#1E293B",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#334155",
  },
  roadVertical1: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "35%",
    width: 20,
    backgroundColor: "#1E293B",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#334155",
  },
  roadVertical2: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: "30%",
    width: 16,
    backgroundColor: "#1E293B",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#334155",
  },
  roundaboutCircle: {
    position: "absolute",
    top: "45%",
    left: "40%",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0B1120",
    borderWidth: 6,
    borderColor: "#334155",
  },
  hotspotContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  hotspotPulse: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  pulseHigh: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
  },
  pulseNormal: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
  },
  hotspotCore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  coreHigh: {
    backgroundColor: BRAND_COLORS.status.error,
  },
  coreNormal: {
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
  },
  hotspotIcon: {
    fontSize: 16,
  },
  hotspotBadge: {
    marginTop: 4,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  hotspotBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  kekeDriverMarker: {
    position: "absolute",
    top: "50%",
    left: "45%",
    alignItems: "center",
    justifyContent: "center",
  },
  driverPulseRing: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  kekeVehicleBody: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  kekeIcon: {
    fontSize: 22,
  },
  speedPill: {
    marginTop: 4,
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  speedText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  activeRouteContainer: {
    position: "absolute",
    top: "28%",
    left: "48%",
    alignItems: "center",
  },
  routePolyline: {
    width: 3,
    height: 100,
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
  },
  routeBadge: {
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.secondary.DEFAULT,
    marginTop: -55,
  },
  routeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND_COLORS.secondary.subtle,
  },
  recenterBtn: {
    position: "absolute",
    bottom: 20,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderDark,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  recenterIcon: {
    fontSize: 20,
  },
});
