import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import { todayISO } from "@/lib/format";

interface Category {
  id: number;
  name: string;
  type: "expense" | "income";
}

const PAYMENT_MODES = ["Cash", "UPI", "Card", "Bank Transfer", "Other"];

export default function AddExpenseScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ date?: string }>();
  const queryClient = useQueryClient();

  const initialDate =
    typeof params.date === "string" && params.date ? params.date : todayISO();

  const [type, setType] = useState<"expense" | "income">("expense");
  const [date, setDate] = useState<string>(initialDate);
  const [category, setCategory] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("Cash");

  const cats = useQuery<Category[]>({
    queryKey: ["expense-categories", type],
    queryFn: () => api<Category[]>(`/api/expense-categories?type=${type}`),
  });

  const filteredCats = useMemo(() => {
    return (cats.data ?? []).filter((c) => c.type === type);
  }, [cats.data, type]);

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api("/api/daily-expenses", { method: "POST", body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      router.back();
    },
    onError: (e: Error) => {
      const msg = e?.message || "Failed to save entry";
      if (Platform.OS === "web") {
        // eslint-disable-next-line no-alert
        window.alert(msg);
      } else {
        Alert.alert("Could not save", msg);
      }
    },
  });

  const canSubmit =
    !!date &&
    !!category &&
    !!amount &&
    !isNaN(parseFloat(amount)) &&
    parseFloat(amount) > 0 &&
    !create.isPending;

  const onSubmit = () => {
    if (!canSubmit) return;
    create.mutate({
      date,
      type,
      category,
      amount: parseFloat(amount),
      description: description || null,
      paymentMode: paymentMode || "Cash",
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: type === "expense" ? "Add Expense" : "Add Income",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.foreground,
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Type
        </Text>
        <View
          style={[
            styles.toggle,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          {(["expense", "income"] as const).map((t) => {
            const active = t === type;
            return (
              <Pressable
                key={t}
                onPress={() => {
                  setType(t);
                  setCategory("");
                }}
                style={[
                  styles.toggleBtn,
                  active && { backgroundColor: colors.card },
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    {
                      color: active ? colors.foreground : colors.mutedForeground,
                    },
                  ]}
                >
                  {t === "expense" ? "Expense" : "Income"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Date (YYYY-MM-DD)
        </Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="2025-01-31"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Amount (₹)
        </Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="decimal-pad"
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
        />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Category
        </Text>
        {filteredCats.length === 0 && cats.isLoading ? (
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Loading categories…
          </Text>
        ) : filteredCats.length === 0 ? (
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="Type a category"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
          />
        ) : (
          <View style={styles.chipsWrap}>
            {filteredCats.map((c) => {
              const active = c.name === category;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.name)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: active
                          ? colors.primaryForeground
                          : colors.foreground,
                      },
                    ]}
                  >
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Payment mode
        </Text>
        <View style={styles.chipsWrap}>
          {PAYMENT_MODES.map((mode) => {
            const active = mode === paymentMode;
            return (
              <Pressable
                key={mode}
                onPress={() => setPaymentMode(mode)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: active
                        ? colors.primaryForeground
                        : colors.foreground,
                    },
                  ]}
                >
                  {mode}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Description (optional)
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Notes…"
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[
            styles.input,
            styles.textarea,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
        />
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.cancel,
            {
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.cancelText, { color: colors.foreground }]}>
            Cancel
          </Text>
        </Pressable>
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.save,
            {
              backgroundColor: colors.primary,
              opacity: !canSubmit ? 0.5 : pressed ? 0.85 : 1,
            },
          ]}
          testID="save-expense"
        >
          <Feather name="check" size={18} color={colors.primaryForeground} />
          <Text style={[styles.saveText, { color: colors.primaryForeground }]}>
            {create.isPending ? "Saving…" : "Save entry"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 6 },
  label: {
    marginTop: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  toggle: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  toggleText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    marginTop: 6,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  hint: {
    marginTop: 6,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  footer: {
    flexDirection: "row",
    padding: 12,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  save: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
