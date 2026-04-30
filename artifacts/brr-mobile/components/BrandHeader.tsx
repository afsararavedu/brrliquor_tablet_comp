import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export function BrandHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 16 : insets.top;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          paddingTop: topPad + 8,
        },
      ]}
    >
      <View style={styles.row}>
        <Image
          source={require("../assets/images/brr-logo.jpeg")}
          style={styles.logo}
          resizeMode="cover"
        />
        <View style={styles.titles}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
  },
  titles: {
    flex: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  right: {
    marginLeft: 8,
  },
});
