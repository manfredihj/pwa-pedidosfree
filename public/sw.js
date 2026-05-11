importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js");

const CACHE_NAME = "pedidosfree-v2";
const PRECACHE_URLS = ["/", "/icon-192x192.png"];
let firebaseInitialized = false;
let tenantIcon = "/icon-192x192.png";

function extractNotificationData(payload) {
  // Firebase can send data in notification, data, or both
  const n = payload.notification || {};
  const d = payload.data || {};
  return {
    title: n.title || d.title || "Nueva notificacion",
    body: n.body || d.description || d.body || "",
    icon: d.icon || n.icon || tenantIcon,
    image: d.has_image === "true" && d.url_image ? d.url_image : undefined,
    url: d.url || d.link || "/",
  };
}

function initFirebase(config) {
  if (firebaseInitialized || !config?.apiKey) return;
  firebase.initializeApp(config);
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    console.log("[SW] onBackgroundMessage payload:", JSON.stringify(payload));
    const { title, body, icon, image, url } = extractNotificationData(payload);
    self.registration.showNotification(title, {
      body,
      icon,
      image,
      badge: "/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: { url },
    });
  });
  firebaseInitialized = true;
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "FIREBASE_CONFIG") {
    initFirebase(event.data.config);
  }
  if (event.data?.type === "TENANT_ICON") {
    tenantIcon = event.data.icon || "/icon-192x192.png";
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch handler — required for install prompt
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached || caches.match("/"))
    )
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  console.log("[SW] push payload:", event.data.text());
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { data: { title: event.data.text() } };
  }
  const { title, body, icon, image, url } = extractNotificationData(payload);
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      image,
      badge: "/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
