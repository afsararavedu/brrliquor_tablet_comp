import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { formatDateLong, shiftDate, todayISO } from "@/lib/format";

export function DateBar({
  date,
  onChange,
}: {
  date: string;
  onChange: (next: string) => void;
}) {
  const colors = useColors();
  const isToday = date === todayISO();

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
      ]}
    >
      <Pressable
        onPress={() => onChange(shiftDate(date, -1))}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: colors.muted, opacity: pressed ? 0.6 : 1 },
        ]}
        hitSlop={8}
      >
        <Feather name="chevron-left" size={20} color={colors.foreground} />
      </Pressable>
      <View style={styles.center}>
        <Text style={[styles.date, { color: colors.foreground }]}>
          {formatDateLong(date)}
        </Text>
        {!isToday ? (
          <Pressable onPress={() => onChange(todayISO())} hitSlop={6}>
            <Text style={[styles.todayBtn, { color: colors.primary }]}>
              Jump to today
            </Text>
          </Pressable>
        ) : (
          <Text style={[styles.todayLabel, { color: colors.mutedForeground }]}>
            Today
          </Text>
        )}
      </View>
      <Pressable
        onPress={() => onChange(shiftDate(date, 1))}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: colors.muted, opacity: pressed ? 0.6 : 1 },
        ]}
        hitSlop={8}
      >
        <Feather name="chevron-right" size={20} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  date: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  todayBtn: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 2,
  },
  todayLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
});
