import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { BRAND_COLORS } from "@kekego/shared";
import { useAuth } from "../context/AuthContext";

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form fields
  const [phoneLocal, setPhoneLocal] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMessage(null);
    const cleanedDigits = phoneLocal.replace(/\D/g, "");

    if (!cleanedDigits) {
      setErrorMessage("Please enter a valid phone number");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    // Format to E.164 (+234...)
    let fullPhone = cleanedDigits;
    if (fullPhone.startsWith("0")) {
      fullPhone = fullPhone.slice(1);
    }
    if (!fullPhone.startsWith("234")) {
      fullPhone = `+234${fullPhone}`;
    } else {
      fullPhone = `+${fullPhone}`;
    }

    setIsLoading(true);
    try {
      if (isRegisterMode) {
        if (!firstName.trim() || !lastName.trim()) {
          setErrorMessage("Please enter your first and last name");
          setIsLoading(false);
          return;
        }
        await register(fullPhone, password, firstName.trim(), lastName.trim());
      } else {
        await login(fullPhone, password);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Authentication failed. Check your network or credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>K</Text>
          </View>
          <Text style={styles.brandTitle}>Kekego</Text>
          <Text style={styles.brandTagline}>
            Smart Tricycle Hailing • Nasarawa State
          </Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          {/* Tabs: Sign In / Register */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, !isRegisterMode && styles.tabBtnActive]}
              onPress={() => {
                setIsRegisterMode(false);
                setErrorMessage(null);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  !isRegisterMode && styles.tabBtnTextActive,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, isRegisterMode && styles.tabBtnActive]}
              onPress={() => {
                setIsRegisterMode(true);
                setErrorMessage(null);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  isRegisterMode && styles.tabBtnTextActive,
                ]}
              >
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Registration Extra Fields */}
          {isRegisterMode && (
            <View style={styles.nameRow}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 6 }]}>
                <Text style={styles.fieldLabel}>FIRST NAME</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Amina"
                  placeholderTextColor={BRAND_COLORS.neutral.textMuted}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 6 }]}>
                <Text style={styles.fieldLabel}>LAST NAME</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Yusuf"
                  placeholderTextColor={BRAND_COLORS.neutral.textMuted}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
          )}

          {/* Phone Number Input with +234 Country Code */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PHONE NUMBER (NIGERIA)</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.countryFlag}>🇳🇬</Text>
                <Text style={styles.countryCodeText}>+234</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.phoneInput]}
                placeholder="803 123 4567"
                placeholderTextColor={BRAND_COLORS.neutral.textMuted}
                keyboardType="phone-pad"
                value={phoneLocal}
                onChangeText={setPhoneLocal}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor={BRAND_COLORS.neutral.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Submit Action */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isRegisterMode ? "Create Passenger Account" : "Sign In"}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNotice}>
            By continuing, you agree to ride safely with verified drivers in
            Lafia, Keffi, and Karu.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 48,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    elevation: 4,
    shadowColor: BRAND_COLORS.primary.active,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  logoBadgeText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: BRAND_COLORS.neutral.textPrimary,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    color: BRAND_COLORS.neutral.textMuted,
    fontWeight: "600",
    marginTop: 2,
  },
  card: {
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND_COLORS.neutral.textMuted,
  },
  tabBtnTextActive: {
    color: BRAND_COLORS.neutral.textPrimary,
    fontWeight: "800",
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorBannerText: {
    color: BRAND_COLORS.status.error,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  nameRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: BRAND_COLORS.neutral.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryCodeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 10,
    height: 48,
    borderRightWidth: 0,
  },
  countryFlag: {
    fontSize: 14,
    marginRight: 4,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
  },
  phoneInput: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    flex: 1,
  },
  textInput: {
    height: 48,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: BRAND_COLORS.neutral.textPrimary,
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 14,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  footerNotice: {
    fontSize: 11,
    color: BRAND_COLORS.neutral.textMuted,
    textAlign: "center",
    lineHeight: 15,
  },
});
