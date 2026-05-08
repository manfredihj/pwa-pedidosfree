"use client";

import { useEffect, useRef } from "react";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/firebase";
import { subscribeToNotifications } from "@/lib/api";

interface FirebaseMessagingProps {
  topics: string[];
}

export default function FirebaseMessaging({ topics }: FirebaseMessagingProps) {
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (subscribedRef.current || topics.length === 0) return;

    async function setup() {
      try {
        console.log("[FCM] Requesting notification permission...");
        const token = await requestNotificationPermission();
        console.log("[FCM] Token:", token ? token.substring(0, 20) + "..." : "null (permission denied)");
        if (!token) return;

        console.log("[FCM] Subscribing to topics:", topics);
        await Promise.all(topics.map((topic) => subscribeToNotifications(token, topic)));
        console.log("[FCM] Subscribed successfully");
        subscribedRef.current = true;
      } catch (err) {
        console.error("[FCM] Error:", err);
      }
    }

    setup();
  }, [topics]);

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
