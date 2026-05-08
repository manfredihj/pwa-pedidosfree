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
  children: ReactNode;
}

export default function FirebaseMessaging({ topics, idgroup, children }: FirebaseMessagingProps) {
  const { getValidToken, isAuthenticated } = useAuth();
  const subscribedWithAuthRef = useRef<boolean | null>(null);
  const subscribingRef = useRef(false);
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) !== "disabled";
  });
  const [loading, setLoading] = useState(false);
  const topicsRef = useRef(topics);
  topicsRef.current = topics;

  // Subscribe
  useEffect(() => {
    if (!enabled || topics.length === 0) return;
    if (subscribedWithAuthRef.current === isAuthenticated) return;
    if (subscribingRef.current) return;

    async function setup() {
      subscribingRef.current = true;
      try {
        console.log("[FCM] Requesting notification permission...");
        const fcmToken = await requestNotificationPermission();
        console.log("[FCM] Token:", fcmToken ? fcmToken.substring(0, 20) + "..." : "null (permission denied)");
        if (!fcmToken) return;

        const accessToken = await getValidToken() || undefined;
        console.log("[FCM] Subscribing to topics:", topics, "authenticated:", !!accessToken);
        await Promise.all(topics.map((topic) => subscribeToNotifications(fcmToken, topic, idgroup, accessToken)));
        console.log("[FCM] Subscribed successfully");
        subscribedWithAuthRef.current = isAuthenticated;
      } catch (err) {
        console.error("[FCM] Error:", err);
      } finally {
        subscribingRef.current = false;
      }
    }

    setup();
  }, [topics, isAuthenticated, getValidToken, enabled, idgroup]);

  // Foreground messages
  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = onForegroundMessage((payload) => {
      const data = (payload as { notification?: { title?: string; body?: string } }).notification;
      if (data?.title) {
        new Notification(data.title, { body: data.body || "" });
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
        subscribedWithAuthRef.current = null;
        setEnabled(false);
      } else {
        // Subscribe
        localStorage.removeItem(STORAGE_KEY);
        setEnabled(true);
        subscribedWithAuthRef.current = null; // Force re-subscribe
      }
    } catch (err) {
      console.error("[FCM] Toggle error:", err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  return (
    <NotificationsContext value={{ enabled, toggle, loading }}>
      {children}
    </NotificationsContext>
  );
}
