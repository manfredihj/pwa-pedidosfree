"use client";

import { useEffect, useRef } from "react";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/firebase";
import { subscribeToNotifications } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

interface FirebaseMessagingProps {
  topics: string[];
}

export default function FirebaseMessaging({ topics }: FirebaseMessagingProps) {
  const { getValidToken, isAuthenticated } = useAuth();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (subscribedRef.current || topics.length === 0) return;

    async function setup() {
      try {
        console.log("[FCM] Requesting notification permission...");
        const fcmToken = await requestNotificationPermission();
        console.log("[FCM] Token:", fcmToken ? fcmToken.substring(0, 20) + "..." : "null (permission denied)");
        if (!fcmToken) return;

        const accessToken = await getValidToken() || undefined;
        console.log("[FCM] Subscribing to topics:", topics, "authenticated:", !!accessToken);
        await Promise.all(topics.map((topic) => subscribeToNotifications(fcmToken, topic, accessToken)));
        console.log("[FCM] Subscribed successfully");
        subscribedRef.current = true;
      } catch (err) {
        console.error("[FCM] Error:", err);
      }
    }

    setup();
  }, [topics, isAuthenticated, getValidToken]);

  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      const data = (payload as { notification?: { title?: string; body?: string } }).notification;
      if (data?.title) {
        new Notification(data.title, { body: data.body || "" });
      }
    });
    return () => { unsubscribe?.(); };
  }, []);

  return null;
}
