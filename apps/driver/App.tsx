import React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { BRAND_COLORS } from "@kekego/shared";
import {
  DriverAuthProvider,
  useDriverAuth,
} from "./src/context/DriverAuthContext";
import { DriverAuthScreen } from "./src/screens/DriverAuthScreen";
import { DriverCockpitScreen } from "./src/screens/DriverCockpitScreen";

function DriverAppContent() {
  const { isAuthenticated, isLoading } = useDriverAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={BRAND_COLORS.secondary.DEFAULT}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {isAuthenticated ? <DriverCockpitScreen /> : <DriverAuthScreen />}
    </View>
  );
}

export default function App() {
  return (
    <DriverAuthProvider>
      <DriverAppContent />
    </DriverAuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND_COLORS.neutral.canvasDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: BRAND_COLORS.neutral.canvasDark,
    alignItems: "center",
    justifyContent: "center",
  },
});
