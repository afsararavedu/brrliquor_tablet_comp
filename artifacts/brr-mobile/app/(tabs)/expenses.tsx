import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BrandHeader } from "@/components/BrandHeader";
import { DateBar } from "@/components/DateBar";
import { EmptyView, ErrorView, LoadingView } from "@/components/StateView";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { formatINR, todayISO } from "@/lib/format";

interface ExpenseRow {
  id: number;
  date: string;
  type: "expense" | "income";
  category: string;
  amount: number | string;
  description?: string | null;
  paymentMode?: string | null;
}

interface DailySaleRow {
  totalSaleValue?: number | string | null;
  saleValue?: number | string | null;
}

export default function ExpensesTab() {
  const colors = useColors();
  const router = useRouter();
  const [date, setDate] = useState<string>(todayISO());

  const expenses = useQuery<ExpenseRow[]>({
    queryKey: ["expenses", date],
    queryFn: () => api<ExpenseRow[]>(`/api/daily-expenses?date=${date}`),
  });

  const sales = useQuery<DailySaleRow[]>({
    queryKey: ["sales", date],
    queryFn: () => api<DailySaleRow[]>(`/api/sales?date=${date}`),
  });

  const list = expenses.data ?? [];
  const expTotal = list
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const incTotal = list
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const salesTotal = (sales.data ?? []).reduce(
    (s, r) => s + (Number(r.totalSaleValue ?? r.saleValue) || 0),
    0,
  );
  const net = salesTotal + incTotal - expTotal;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <BrandHeader title="Expenses" subtitle="Daily income & expenses" />
      <DateBar date={date} onChange={setDate} />

      <View style={styles.summaryGrid}>
        <SummaryCard
          label="Sales"
          value={formatINR(salesTotal)}
          icon="trending-up"
          tone={colors.primary}
          colors={colors}
        />
        <SummaryCard
          label="Income"
          value={formatINR(incTotal)}
          icon="arrow-down-circle"
          tone={colors.success}
          colors={colors}
        />
        <SummaryCard
          label="Expenses"
          value={formatINR(expTotal)}
          icon="arrow-up-circle"
          tone={colors.destructive}
          colors={colors}
        />
        <SummaryCard
          label="Net"
          value={formatINR(net)}
          icon="dollar-sign"
          tone={net >= 0 ? colors.success : colors.destructive}
          colors={colors}
        />
      </View>

      {expenses.isLoading ? (
        <LoadingView label="Loading entries…" />
      ) : expenses.isError ? (
        <ErrorView
          message={(expenses.error as Error).message}
          onRetry={() => expenses.refetch()}
        />
      ) : list.length === 0 ? (
        <EmptyView
          icon="dollar-sign"
          title="No entries for this date"
          subtitle="Tap the + button below to add your first entry."
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={expenses.isRefetching}
              onRefresh={() => expenses.refetch()}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const isIncome = item.type === "income";
            const tone = isIncome ? colors.success : colors.destructive;
            return (
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconBubble,
                    { backgroundColor: tone + "1A" },
                  ]}
                >
                  <Feather
                    name={isIncome ? "arrow-down-left" : "arrow-up-right"}
                    size={18}
                    color={tone}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.rowTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {item.category}
                  </Text>
                  {item.description ? (
                    <Text
                      style={[
                        styles.rowSub,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                  ) : null}
                  {item.paymentMode ? (
                    <Text
                      style={[
                        styles.rowMeta,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {item.paymentMode}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.amount, { color: tone }]}>
                  {isIncome ? "+" : "−"}
                  {formatINR(item.amount)}
                </Text>
              </View>
            );
          }}
        />
      )}

      <Pressable
        onPress={() => router.push(`/expense-add?date=${date}`)}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        testID="add-expense"
      >
        <Feather name="plus" size={26} color={colors.primaryForeground} />
      </Pressable>
    </View>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
  colors,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  tone: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.summary,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={[styles.summaryIcon, { backgroundColor: tone + "1A" }]}>
        <Feather name={icon} size={16} color={tone} />
      </View>
      <Text
        style={[styles.summaryLabel, { color: colors.mutedForeground }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={[styles.summaryValue, { color: colors.foreground }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 10,
  },
  summary: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 6,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },
  summaryValue: { fontFamily: "Inter_700Bold", fontSize: 16 },

  list: { paddingHorizontal: 12, paddingBottom: 120, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  rowSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  rowMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  amount: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
