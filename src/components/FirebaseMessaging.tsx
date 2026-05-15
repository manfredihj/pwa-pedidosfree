"use client";

import { useEffect, useRef, createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { requestNotificationPermission, getCurrentToken, onForegroundMessage } from "@/lib/firebase";
import { subscribeToNotifications, unsubscribeFromNotifications } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const STORAGE_KEY = "pf_notifications";

interface NotificationsContextValue {
  enabled: boolean;
  toggle: () => Promise<void>;
  loading: boolean;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  enabled: false,
  toggle: async () => {},
  loading: false,
});

export function useNotifications() {
  return useContext(NotificationsContext);
}

interface FirebaseMessagingProps {
  topics: string[];
  idgroup: number;
  tenantIcon?: string;
  children: ReactNode;
}

export default function FirebaseMessaging({ topics, idgroup, tenantIcon, children }: FirebaseMessagingProps) {
  const { getValidToken, isAuthenticated } = useAuth();
  const subscribingRef = useRef(false);
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    // Only enabled if user previously accepted AND browser permission is granted
    if (localStorage.getItem(STORAGE_KEY) === "disabled") return false;
    return typeof Notification !== "undefined" && Notification.permission === "granted";
  });
  const [loading, setLoading] = useState(false);
  const topicsRef = useRef(topics);
  topicsRef.current = topics;

  // Send tenant icon to SW
  useEffect(() => {
    if (!tenantIcon || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ type: "TENANT_ICON", icon: tenantIcon });
    });
  }, [tenantIcon]);

  // Auto-subscribe on every app load if permission is granted (keeps backend table updated)
  useEffect(() => {
    if (!enabled || topics.length === 0) return;
    if (subscribingRef.current) return;

    async function setup() {
      subscribingRef.current = true;
      try {
        const fcmToken = await getCurrentToken();
        if (!fcmToken) return;

        const accessToken = await getValidToken() || undefined;
        console.log("[FCM] Subscribing to topics:", topics);
        await Promise.all(topics.map((topic) => subscribeToNotifications(fcmToken, topic, idgroup, accessToken)));
        console.log("[FCM] Subscribed successfully");
      } catch (err) {
        console.error("[FCM] Error:", err);
      } finally {
        subscribingRef.current = false;
      }
    }

    setup();
  }, [topics, isAuthenticated, getValidToken, enabled, idgroup]);

  // Foreground messages (only if permission granted)
  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = onForegroundMessage((payload) => {
      const data = (payload as { notification?: { title?: string; body?: string } }).notification;
      if (data?.title) {
        new Notification(data.title, { body: data.body || "", icon: tenantIcon });
      }
    });
    return () => { unsubscribe?.(); };
  }, [enabled]);

  const toggle = useCallback(async () => {
    setLoading(true);
    try {
      if (enabled) {
        // Unsubscribe
        const fcmToken = await getCurrentToken();
        if (fcmToken && topicsRef.current.length > 0) {
          await unsubscribeFromNotifications(fcmToken, topicsRef.current);
        }
        localStorage.setItem(STORAGE_KEY, "disabled");
        setEnabled(false);
      } else {
        // Request permission and subscribe
        console.log("[FCM] Requesting notification permission...");
        const fcmToken = await requestNotificationPermission();
        if (!fcmToken) {
          console.log("[FCM] Permission denied or failed");
          return;
        }
        console.log("[FCM] Permission granted, subscribing...");
        const accessToken = await getValidToken() || undefined;
        await Promise.all(topicsRef.current.map((topic) =>
          subscribeToNotifications(fcmToken, topic, idgroup, accessToken)
        ));
        localStorage.removeItem(STORAGE_KEY);
        setEnabled(true);
        console.log("[FCM] Subscribed successfully");
      }
    } catch (err) {
      console.error("[FCM] Toggle error:", err);
    } finally {
      setLoading(false);
    }
  }, [enabled, getValidToken, isAuthenticated, idgroup]);

  return (
    <NotificationsContext value={{ enabled, toggle, loading }}>
      {children}
    </NotificationsContext>
  );
}
