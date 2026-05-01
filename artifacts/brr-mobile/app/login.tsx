import * as Haptics from "expo-haptics";
import { Image, ImageBackground } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { ApiError } from "@/lib/api";

function formatRemaining(totalSec: number): string {
  if (totalSec <= 0) return "0 seconds";
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes <= 0) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }
  if (seconds === 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  return `${minutes} min ${seconds} sec`;
}

export default function LoginScreen() {
  const colors = useColors();
  const { login, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Wall-clock time (ms) at which the lockout expires, or null if not locked.
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  // How many failed attempts the server says we have left before the
  // lockout kicks in. Populated from the 401 response body and only
  // surfaced when the count is uncomfortably low. Cleared on each new
  // submit so the warning can't linger after a successful retry.
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(
    null,
  );

  // Countdown interval — only active while we're locked out so the
  // submit button re-enables itself the moment the lockout window passes.
  useEffect(() => {
    if (lockoutUntil === null) return;
    setNow(Date.now());
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= lockoutUntil) {
        setLockoutUntil(null);
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lockoutUntil]);

  const remainingSec =
    lockoutUntil !== null
      ? Math.max(0, Math.ceil((lockoutUntil - now) / 1000))
      : 0;
  const isLocked = remainingSec > 0;

  const onSubmit = async () => {
    if (!username || !password || submitting || isLocked) return;
    setSubmitting(true);
    setAttemptsRemaining(null);
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    try {
      await login(username.trim(), password);
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        const data = (e.data ?? {}) as { retryAfterSec?: unknown };
        const sec =
          typeof data.retryAfterSec === "number" && data.retryAfterSec > 0
            ? Math.ceil(data.retryAfterSec)
            : 60;
        setLockoutUntil(Date.now() + sec * 1000);
      } else if (e instanceof ApiError && e.status === 401) {
        // 401 carries `attemptsRemaining` so we can warn the user
        // before the next miss locks them out for 15 minutes.
        const data = (e.data ?? {}) as { attemptsRemaining?: unknown };
        if (typeof data.attemptsRemaining === "number") {
          setAttemptsRemaining(Math.max(0, data.attemptsRemaining));
        }
      }
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
          () => {},
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={require("../assets/images/login-bg.png")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <View style={[StyleSheet.absoluteFill, styles.overlay]} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <View style={styles.center}>
            <View style={[styles.card, { backgroundColor: "#ffffff" }]}>
              <View style={styles.logoWrap}>
                <Image
                  source={require("../assets/images/brr-logo.jpeg")}
                  style={styles.logo}
                  contentFit="cover"
                />
              </View>
              <Text style={[styles.heading, { color: "#1f2937" }]}>
                BRR Liquor Soft
              </Text>
              <Text style={[styles.sub, { color: "#6b7280" }]}>
                Sign in to your dashboard
              </Text>

              <View style={styles.field}>
                <Text style={[styles.label, { color: "#374151" }]}>
                  Username
                </Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  style={[
                    styles.input,
                    { borderColor: "#d1d5db", color: "#111827" },
                  ]}
                  testID="login-username"
                />
              </View>
              <View style={styles.field}>
                <Text style={[styles.label, { color: "#374151" }]}>
                  Password
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  autoComplete="current-password"
                  textContentType="password"
                  style={[
                    styles.input,
                    { borderColor: "#d1d5db", color: "#111827" },
                  ]}
                  onSubmitEditing={onSubmit}
                  returnKeyType="go"
                  testID="login-password"
                />
              </View>

              {isLocked ? (
                <View style={styles.lockoutBox} testID="login-lockout">
                  <Text style={styles.lockoutTitle}>
                    Too many failed attempts
                  </Text>
                  <Text style={styles.lockoutBody}>
                    For security, login is paused. Try again in{" "}
                    <Text
                      style={styles.lockoutBodyStrong}
                      testID="login-lockout-remaining"
                    >
                      {formatRemaining(remainingSec)}
                    </Text>
                    .
                  </Text>
                </View>
              ) : error ? (
                <View>
                  <Text style={[styles.error, { color: colors.destructive }]}>
                    {error}
                  </Text>
                  {attemptsRemaining !== null &&
                    attemptsRemaining <= 2 ? (
                    <Text
                      style={[
                        styles.attemptsWarning,
                        { color: colors.destructive },
                      ]}
                      testID="login-attempts-warning"
                    >
                      {attemptsRemaining === 0
                        ? "No attempts remaining — this account is now temporarily locked."
                        : attemptsRemaining === 1
                          ? "1 attempt remaining before this account is temporarily locked."
                          : `${attemptsRemaining} attempts remaining before this account is temporarily locked.`}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <Pressable
                onPress={onSubmit}
                disabled={submitting || !username || !password || isLocked}
                style={({ pressed }) => [
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                    opacity:
                      submitting || !username || !password || isLocked
                        ? 0.6
                        : pressed
                          ? 0.85
                          : 1,
                  },
                ]}
                testID="login-submit"
              >
                {submitting ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text
                    style={[
                      styles.buttonText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    {isLocked
                      ? `Locked — wait ${formatRemaining(remainingSec)}`
                      : "Login"}
                  </Text>
                )}
              </Pressable>

              <Text style={[styles.hint, { color: "#9ca3af" }]}>
                Use the same login as the BRR Liquor Soft web app.
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  safe: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#f3f4f6",
  },
  heading: {
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    marginTop: 8,
  },
  sub: {
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  field: {
    marginTop: 12,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  error: {
    marginTop: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    textAlign: "center",
  },
  attemptsWarning: {
    marginTop: 6,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textAlign: "center",
  },
  lockoutBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  lockoutTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#991b1b",
    marginBottom: 2,
  },
  lockoutBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#991b1b",
  },
  lockoutBodyStrong: {
    fontFamily: "Inter_600SemiBold",
    color: "#991b1b",
  },
  button: {
    marginTop: 18,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  hint: {
    marginTop: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
  },
});
