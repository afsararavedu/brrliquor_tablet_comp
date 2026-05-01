import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const COOKIE_KEY = "brr.session.cookie";

function getBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain && domain.length > 0) {
    return `https://${domain}`;
  }
  return "";
}

let cachedCookie: string | null = null;
let cookieLoaded = false;

async function loadCookie(): Promise<string | null> {
  if (cookieLoaded) return cachedCookie;
  cookieLoaded = true;
  try {
    cachedCookie = await AsyncStorage.getItem(COOKIE_KEY);
  } catch {
    cachedCookie = null;
  }
  return cachedCookie;
}

export async function getStoredCookie(): Promise<string | null> {
  return loadCookie();
}

export async function setStoredCookie(value: string | null): Promise<void> {
  cachedCookie = value;
  cookieLoaded = true;
  try {
    if (value) {
      await AsyncStorage.setItem(COOKIE_KEY, value);
    } else {
      await AsyncStorage.removeItem(COOKIE_KEY);
    }
  } catch {
    // best-effort
  }
}

function parseSidFromSetCookie(
  setCookie: string | string[] | null | undefined,
): string | null {
  if (!setCookie) return null;
  const candidates = Array.isArray(setCookie)
    ? setCookie
    : setCookie.split(/,(?=\s*\w+=)/);
  for (const part of candidates) {
    const m = part.match(/connect\.sid=([^;]+)/);
    if (m) return `connect.sid=${m[1]}`;
  }
  return null;
}

function readSetCookie(headers: Headers): string | string[] | null {
  // Standard accessor — works in modern RN/web fetch.
  const direct = headers.get("set-cookie");
  if (direct) return direct;
  // Some React Native fetch implementations expose set-cookie only via
  // the internal `map` field. Fall back to that when needed.
  const map = (headers as unknown as { map?: Record<string, string | string[]> })
    .map;
  if (map) {
    return map["set-cookie"] ?? map["Set-Cookie"] ?? null;
  }
  // Last-resort: raw() exists in some node-fetch-like implementations.
  const raw = (headers as unknown as { raw?: () => Record<string, string[]> })
    .raw;
  if (typeof raw === "function") {
    const obj = raw();
    return obj["set-cookie"] ?? obj["Set-Cookie"] ?? null;
  }
  return null;
}

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data: unknown = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const base = getBaseUrl();
  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers || {}),
  };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const cookie = await loadCookie();
  if (cookie && Platform.OS !== "web") {
    headers["Cookie"] = cookie;
  }

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  // Capture session cookie if present (native only — web cookies are managed by browser).
  if (Platform.OS !== "web") {
    const setCookie = readSetCookie(res.headers);
    const sid = parseSidFromSetCookie(setCookie);
    if (sid) {
      await setStoredCookie(sid);
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let data: unknown = null;
    try {
      const text = await res.text();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          data = parsed;
          message = parsed.message || parsed.error || text;
        } catch {
          data = text;
          message = text;
        }
      }
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message, data);
  }

  if (res.status === 204) return undefined as unknown as T;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}
