import React from "react";
import { StyleSheet, Text, View, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { BRAND_COLORS } from "@kekego/shared";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>K</Text>
        </View>
        <Text style={styles.title}>Kekego Passenger</Text>
        <Text style={styles.subtitle}>Ride safely across Nasarawa State</Text>
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>Foundation Initialized</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "85%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: BRAND_COLORS.neutral.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: BRAND_COLORS.neutral.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
  statusBox: {
    backgroundColor: BRAND_COLORS.primary.subtle,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusText: {
    color: BRAND_COLORS.primary.active,
    fontSize: 12,
    fontWeight: "600",
  },
});
