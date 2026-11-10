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
import { BRAND_COLORS, VehicleType } from "@kekego/shared";
import { useDriverAuth } from "../context/DriverAuthContext";

export const DriverAuthScreen: React.FC = () => {
  const { login, register } = useDriverAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form fields
  const [phoneLocal, setPhoneLocal] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleColor, setVehicleColor] = useState("Yellow");

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
          setErrorMessage("First and last name are required");
          setIsLoading(false);
          return;
        }
        if (!licenseNumber.trim()) {
          setErrorMessage("Valid driver's license number is required");
          setIsLoading(false);
          return;
        }
        if (!plateNumber.trim()) {
          setErrorMessage("Vehicle plate number is required");
          setIsLoading(false);
          return;
        }

        await register({
          phoneNumber: fullPhone,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          licenseNumber: licenseNumber.trim(),
          vehicle: {
            plateNumber: plateNumber.trim().toUpperCase(),
            make: "Bajaj",
            model: "RE 4S",
            color: vehicleColor.trim(),
            type: VehicleType.KEKE_NAPEP,
          },
        });
      } else {
        await login(fullPhone, password);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Authentication failed"
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
          <Text style={styles.brandTitle}>Kekego Driver Partner</Text>
          <Text style={styles.brandTagline}>
            Commercial Tricycle Cockpit • Nasarawa State
          </Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          {/* Tabs: Sign In / Onboarding Register */}
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
                Partner Sign In
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
                Onboarding
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
            <>
              <View style={styles.nameRow}>
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={styles.fieldLabel}>FIRST NAME</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Haruna"
                    placeholderTextColor="#64748B"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={styles.fieldLabel}>LAST NAME</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Musa"
                    placeholderTextColor="#64748B"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>DRIVER'S LICENSE NUMBER</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="NSR-849204-DL"
                  placeholderTextColor="#64748B"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                />
              </View>

              <View style={styles.nameRow}>
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={styles.fieldLabel}>VEHICLE PLATE</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="LAF-482-XA"
                    placeholderTextColor="#64748B"
                    value={plateNumber}
                    onChangeText={setPlateNumber}
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={styles.fieldLabel}>TRICYCLE COLOR</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Yellow"
                    placeholderTextColor="#64748B"
                    value={vehicleColor}
                    onChangeText={setVehicleColor}
                  />
                </View>
              </View>
            </>
          )}

          {/* Phone Number Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PHONE NUMBER (NIGERIA)</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.countryFlag}>🇳🇬</Text>
                <Text style={styles.countryCodeText}>+234</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.phoneInput]}
                placeholder="802 345 6789"
                placeholderTextColor="#64748B"
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
              placeholderTextColor="#64748B"
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
                {isRegisterMode
                  ? "Submit Onboarding Application"
                  : "Enter Driver Cockpit"}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNotice}>
            Licensed under Nasarawa State Ministry of Transport. Only verified
            tricycles can accept metered trips.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.neutral.canvasDark,
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
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    elevation: 4,
  },
  logoBadgeText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: BRAND_COLORS.neutral.textLight,
  },
  brandTagline: {
    fontSize: 12,
    color: BRAND_COLORS.neutral.textMutedDark,
    fontWeight: "600",
    marginTop: 2,
  },
  card: {
    backgroundColor: BRAND_COLORS.neutral.cardDark,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderDark,
    elevation: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#0B1120",
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
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.neutral.textMutedDark,
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BRAND_COLORS.status.error,
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
    color: BRAND_COLORS.neutral.textMutedDark,
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
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderDark,
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
    color: BRAND_COLORS.neutral.textLight,
  },
  phoneInput: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    flex: 1,
  },
  textInput: {
    height: 48,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: BRAND_COLORS.neutral.textLight,
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: BRAND_COLORS.secondary.DEFAULT,
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
    color: BRAND_COLORS.neutral.textMutedDark,
    textAlign: "center",
    lineHeight: 15,
  },
});
