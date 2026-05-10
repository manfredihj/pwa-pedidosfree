import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messaging: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (typeof window === "undefined") return null;
  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
}

export async function requestNotificationPermission(): Promise<string | null> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  // Wait for service worker to be ready
  const swRegistration = await navigator.serviceWorker.ready;

  const msg = getMessagingInstance();
  if (!msg) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const token = await getToken(msg, {
    vapidKey,
    serviceWorkerRegistration: swRegistration,
  });

  return token;
}

export async function getCurrentToken(): Promise<string | null> {
  if (!("Notification" in window) || Notification.permission !== "granted") return null;
  const msg = getMessagingInstance();
  if (!msg) return null;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const swRegistration = await navigator.serviceWorker.ready;
  return getToken(msg, {
    vapidKey,
    serviceWorkerRegistration: swRegistration,
  });
}

export function onForegroundMessage(callback: (payload: unknown) => void): (() => void) | null {
  const msg = getMessagingInstance();
  if (!msg) return null;
  return onMessage(msg, callback);
}
