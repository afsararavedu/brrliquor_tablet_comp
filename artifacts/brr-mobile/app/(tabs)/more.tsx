import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BrandHeader } from "@/components/BrandHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function MoreTab() {
  const colors = useColors();
  const { user, logout } = useAuth();

  const onLogout = () => {
    if (Platform.OS === "web") {
      logout();
      return;
    }
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <BrandHeader title="Account" subtitle="Profile & settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.profile,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Image
            source={require("../../assets/images/brr-logo.jpeg")}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {user?.fullName || user?.username || "—"}
            </Text>
            <Text style={[styles.username, { color: colors.mutedForeground }]}>
              @{user?.username}
            </Text>
            <View
              style={[
                styles.rolePill,
                {
                  backgroundColor: colors.accent,
                  alignSelf: "flex-start",
                  marginTop: 6,
                },
              ]}
            >
              <Text
                style={[styles.roleText, { color: colors.accentForeground }]}
              >
                {(user?.role || "user").toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.list,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <InfoRow
            icon="globe"
            label="Connected to"
            value="BRR Liquor Soft web app"
            colors={colors}
          />
          <Divider colors={colors} />
          <InfoRow
            icon="refresh-ccw"
            label="Data sync"
            value="Pull-to-refresh on each tab"
            colors={colors}
          />
          <Divider colors={colors} />
          <InfoRow
            icon="shield"
            label="Sign-in"
            value="Same as the web dashboard"
            colors={colors}
          />
        </View>

        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [
            styles.logout,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          testID="logout"
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>
            Log out
          </Text>
        </Pressable>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          BRR Liquor Soft Mobile · v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={16} color={colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <Text
          style={[styles.infoValue, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingBottom: 120, gap: 14 },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  name: { fontFamily: "Inter_700Bold", fontSize: 17 },
  username: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  roleText: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 0.5 },
  list: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  infoValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginTop: 2,
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 44 },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  version: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
  },
});
