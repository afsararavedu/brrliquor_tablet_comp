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
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { formatINR, todayISO } from "@/lib/format";

interface DailySaleRow {
  id?: number;
  brandNumber: string;
  brandName: string;
  size: string;
  quantityPerCase?: number | null;
  openingBalanceBottles?: number | null;
  newStockBottles?: number | null;
  newStockCases?: number | null;
  totalClosingStock?: number | null;
  closingBalanceCases?: number | null;
  closingBalanceBottles?: number | null;
  breakageBottles?: number | null;
  soldBottles?: number | null;
  totalSaleValue?: number | string | null;
  saleValue?: number | string | null;
  mrp?: number | string | null;
  invoiceDate?: string | null;
  saleDate?: string | null;
}

export default function SalesTab() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [date, setDate] = useState<string>(todayISO());

  const query = useQuery<DailySaleRow[]>({
    queryKey: ["sales", date],
    queryFn: () => api<DailySaleRow[]>(`/api/sales?date=${date}`),
  });

  const submittedQuery = useQuery<{ isSubmitted: boolean }>({
    queryKey: ["sales-is-submitted", date],
    queryFn: () =>
      api<{ isSubmitted: boolean }>(
        `/api/sales/is-submitted?date=${encodeURIComponent(date)}`,
      ),
    enabled: !!date,
  });

  const isAdmin = user?.role === "admin";
  const isLocked = !!submittedQuery.data?.isSubmitted && !isAdmin;

  const rows = query.data ?? [];
  const totalSold = rows.reduce(
    (s, r) => s + (Number(r.soldBottles) || 0),
    0,
  );
  const totalValue = rows.reduce(
    (s, r) => s + (Number(r.totalSaleValue ?? r.saleValue) || 0),
    0,
  );

  const openEdit = (item: DailySaleRow) => {
    if (isLocked) return;
    router.push({
      pathname: "/sale-edit",
      params: {
        saleDate: date,
        brandNumber: item.brandNumber,
        brandName: item.brandName,
        size: item.size,
        quantityPerCase: String(item.quantityPerCase ?? 0),
        mrp: String(item.mrp ?? 0),
        openingBalanceBottles: String(item.openingBalanceBottles ?? 0),
        newStockCases: String(item.newStockCases ?? 0),
        newStockBottles: String(item.newStockBottles ?? 0),
        closingBalanceCases: String(item.closingBalanceCases ?? 0),
        closingBalanceBottles: String(item.closingBalanceBottles ?? 0),
        breakageBottles: String(item.breakageBottles ?? 0),
        soldBottles: String(item.soldBottles ?? 0),
        invoiceDate: item.invoiceDate ?? date,
      },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <BrandHeader title="Daily Sales" subtitle="Today's sales summary" />
      <DateBar date={date} onChange={setDate} />

      {isLocked ? (
        <View
          style={[
            styles.lockBanner,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <Feather name="lock" size={14} color={colors.mutedForeground} />
          <Text
            style={[styles.lockText, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            Sales for this date are submitted and locked.
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.summary,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
            Bottles sold
          </Text>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>
            {totalSold.toLocaleString("en-IN")}
          </Text>
        </View>
        <View
          style={[styles.divider, { backgroundColor: colors.border }]}
        />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
            Sales value
          </Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>
            {formatINR(totalValue)}
          </Text>
        </View>
      </View>

      {query.isLoading ? (
        <LoadingView label="Loading sales…" />
      ) : query.isError ? (
        <ErrorView
          message={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyView
          icon="bar-chart-2"
          title="No sales for this date"
          subtitle="Switch dates with the arrows above, or enter sales from the web dashboard."
        />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, idx) =>
            `${item.brandNumber}-${item.size}-${idx}`
          }
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => {
                query.refetch();
                submittedQuery.refetch();
              }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openEdit(item)}
              disabled={isLocked}
              testID={`sale-row-${item.brandNumber}-${item.size}`}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                  opacity: pressed && !isLocked ? 0.85 : 1,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.brandNo, { color: colors.mutedForeground }]}
                  >
                    {item.brandNumber}
                  </Text>
                  <Text
                    style={[styles.brandName, { color: colors.foreground }]}
                    numberOfLines={2}
                  >
                    {item.brandName}
                  </Text>
                </View>
                <View
                  style={[
                    styles.sizePill,
                    { backgroundColor: colors.accent },
                  ]}
                >
                  <Text
                    style={[styles.sizeText, { color: colors.accentForeground }]}
                  >
                    {item.size}
                  </Text>
                </View>
                {!isLocked ? (
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={colors.mutedForeground}
                  />
                ) : null}
              </View>
              <View style={styles.cardGrid}>
                <Stat
                  label="Closing"
                  value={`${item.closingBalanceCases ?? 0} Cs / ${item.closingBalanceBottles ?? 0} Btls`}
                  colors={colors}
                />
                <Stat
                  label="Sold"
                  value={`${Number(item.soldBottles) || 0} Btls`}
                  colors={colors}
                />
                <Stat
                  label="Sales value"
                  value={formatINR(item.totalSaleValue ?? item.saleValue)}
                  highlight
                  colors={colors}
                />
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function Stat({
  label,
  value,
  highlight,
  colors,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.statValue,
          { color: highlight ? colors.primary : colors.foreground },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  lockBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lockText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    flex: 1,
  },
  summary: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
  },
  list: {
    padding: 16,
    paddingBottom: 96,
    gap: 10,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  brandNo: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  brandName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginTop: 2,
  },
  sizePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sizeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  cardGrid: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
