import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export function LoadingView({ label }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} />
      {label ? (
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export function EmptyView({
  icon = "inbox",
  title,
  subtitle,
}: {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <Feather name={icon} size={36} color={colors.mutedForeground} />
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <Feather name="alert-circle" size={36} color={colors.destructive} />
      <Text style={[styles.title, { color: colors.foreground }]}>
        Something went wrong
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retry,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={[styles.retryText, { color: colors.primaryForeground }]}>
            Retry
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },
  label: {
    marginTop: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  title: {
    marginTop: 8,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
  },
  retry: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
