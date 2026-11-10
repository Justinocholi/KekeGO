import React from "react";
import { StyleSheet, Text, View, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { BRAND_COLORS } from "@kekego/shared";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.card}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>K</Text>
        </View>
        <Text style={styles.title}>Kekego Driver Partner</Text>
        <Text style={styles.subtitle}>Drive & earn in Nasarawa State</Text>
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>Cockpit Ready (Offline)</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.neutral.canvasDark,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderColor: BRAND_COLORS.neutral.borderDark,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "85%",
    maxWidth: 360,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: BRAND_COLORS.neutral.textLight,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: BRAND_COLORS.neutral.textMutedDark,
    textAlign: "center",
    marginBottom: 20,
  },
  statusBox: {
    backgroundColor: "rgba(15, 118, 110, 0.2)",
    borderColor: BRAND_COLORS.secondary.DEFAULT,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusText: {
    color: "#2DD4BF",
    fontSize: 12,
    fontWeight: "600",
  },
});
