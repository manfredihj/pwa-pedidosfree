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
        const token = await requestNotificationPermission();
        if (!token) return;

        await Promise.all(topics.map((topic) => subscribeToNotifications(token, topic)));
        subscribedRef.current = true;
      } catch {
        // Silent fail — notifications are not critical
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
