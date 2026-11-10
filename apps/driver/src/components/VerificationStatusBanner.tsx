import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { BRAND_COLORS, DriverVerificationStatus } from "@kekego/shared";

interface VerificationStatusBannerProps {
  status: DriverVerificationStatus;
  onOpenOnboarding?: () => void;
}

export const VerificationStatusBanner: React.FC<VerificationStatusBannerProps> = ({
  status,
  onOpenOnboarding,
}) => {
  if (status === DriverVerificationStatus.VERIFIED) {
    return null; // No warning needed when fully verified
  }

  const statusConfigs = {
    [DriverVerificationStatus.PENDING_REVIEW]: {
      title: "Verification Under Review",
      description:
        "Your driver's license and vehicle documents are being reviewed by the Kekego operations team in Lafia. Online dispatch will activate upon approval.",
      color: BRAND_COLORS.primary.DEFAULT,
      bg: "rgba(245, 158, 11, 0.15)",
      actionText: "Check Inspection Centers",
    },
    [DriverVerificationStatus.UNVERIFIED]: {
      title: "Onboarding Incomplete",
      description:
        "Complete your driver profile, vehicle details, and license registration to unlock ride requests across Nasarawa State.",
      color: "#94A3B8",
      bg: "rgba(148, 163, 184, 0.15)",
      actionText: "Complete Verification Form",
    },
    [DriverVerificationStatus.REJECTED]: {
      title: "Verification Rejected",
      description:
        "Your documents did not meet regulatory standards. Please re-upload valid government documentation.",
      color: BRAND_COLORS.status.error,
      bg: "rgba(239, 68, 68, 0.15)",
      actionText: "Update Documents",
    },
    [DriverVerificationStatus.SUSPENDED]: {
      title: "Account Suspended",
      description:
        "Your partner account has been temporarily suspended. Please visit the Kekego Lafia Hub.",
      color: BRAND_COLORS.status.error,
      bg: "rgba(239, 68, 68, 0.15)",
      actionText: "Contact Support",
    },
  };

  const config =
    statusConfigs[status] || statusConfigs[DriverVerificationStatus.UNVERIFIED];

  return (
    <View style={[styles.bannerContainer, { backgroundColor: config.bg, borderColor: config.color }]}>
      <View style={styles.headerRow}>
        <View style={[styles.statusIndicator, { backgroundColor: config.color }]} />
        <Text style={[styles.bannerTitle, { color: config.color }]}>
          {config.title}
        </Text>
      </View>

      <Text style={styles.bannerDesc}>{config.description}</Text>

      {onOpenOnboarding && (
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: config.color }]}
          onPress={onOpenOnboarding}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionBtnText, { color: config.color }]}>
            {config.actionText} ›
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  bannerDesc: {
    fontSize: 11,
    color: BRAND_COLORS.neutral.textLight,
    lineHeight: 15,
    marginBottom: 8,
  },
  actionBtn: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: "800",
  },
});
