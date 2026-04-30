import * as Haptics from "expo-haptics";
import { Image, ImageBackground } from "expo-image";
import React, { useState } from "react";
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

export default function LoginScreen() {
  const colors = useColors();
  const { login, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!username || !password || submitting) return;
    setSubmitting(true);
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    try {
      await login(username.trim(), password);
    } catch {
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

              {error ? (
                <Text style={[styles.error, { color: colors.destructive }]}>
                  {error}
                </Text>
              ) : null}

              <Pressable
                onPress={onSubmit}
                disabled={submitting || !username || !password}
                style={({ pressed }) => [
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                    opacity:
                      submitting || !username || !password
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
                    Login
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
