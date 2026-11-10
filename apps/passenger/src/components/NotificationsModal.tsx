import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { BRAND_COLORS } from "@kekego/shared";

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  onClose,
}) => {
  const notifications = [
    {
      id: "notif-1",
      title: "Welcome to Kekego Nasarawa!",
      body: "Enjoy safe, metered tricycle hailing across Lafia, Keffi, and Karu. Check your wallet for ₦2,500 promotional credit.",
      time: "Just now",
      icon: "🎉",
      isUnread: true,
    },
    {
      id: "notif-2",
      title: "Safety Reminder: Boarding Verification",
      body: "Always verify the 4-digit start OTP with your driver before boarding any commercial tricycle.",
      time: "2 hours ago",
      icon: "🛡️",
      isUnread: false,
    },
    {
      id: "notif-3",
      title: "Lafia Modern Market Zone Active",
      body: "High driver availability around Makurdi-Jos Road. Average pickup time: 3 minutes.",
      time: "Yesterday",
      icon: "📍",
      isUnread: false,
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* List */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ padding: 16 }}
        >
          {notifications.map((item) => (
            <View
              key={item.id}
              style={[
                styles.notifCard,
                item.isUnread && styles.notifCardUnread,
              ]}
            >
              <View style={styles.iconCircle}>
                <Text style={styles.emoji}>{item.icon}</Text>
              </View>
              <View style={styles.content}>
                <View style={styles.topRow}>
                  <Text style={styles.title}>{item.title}</Text>
                  {item.isUnread && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </View>
          ))}
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
  list: {
    flex: 1,
  },
  notifCard: {
    flexDirection: "row",
    backgroundColor: BRAND_COLORS.neutral.cardLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BRAND_COLORS.neutral.borderLight,
  },
  notifCardUnread: {
    borderColor: BRAND_COLORS.primary.DEFAULT,
    backgroundColor: "#FFFDF5",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.neutral.canvasLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  emoji: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLORS.neutral.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_COLORS.primary.DEFAULT,
    marginLeft: 6,
  },
  body: {
    fontSize: 12,
    color: BRAND_COLORS.neutral.textMuted,
    lineHeight: 16,
    marginBottom: 6,
  },
  time: {
    fontSize: 10,
    fontWeight: "600",
    color: BRAND_COLORS.neutral.textMuted,
  },
});
