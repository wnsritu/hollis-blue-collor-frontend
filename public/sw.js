/**
 * Service Worker for Hollis Blue Collar Web Push Notifications
 * Works when the website is open, in the background, or when tabs/browser are closed.
 */

self.addEventListener("install", (event) => {
  // Activate immediately without waiting for existing clients to reload
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Claim all active clients immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { message: event.data.text() };
    }
  }

  const title = data.title || "Hollis Blue Collar";
  const body = data.message || "You have a new update.";
  const icon = data.icon || "/hollis-logo.png";
  const badge = "/favicon.ico";
  const url = data.url || "/";

  const options = {
    body,
    icon,
    badge,
    data: {
      url,
      id: data.id,
      referenceId: data.referenceId,
      timestamp: Date.now(),
    },
    // Use tag to deduplicate notifications if received rapidly
    tag: data.id ? `hollis-notif-${data.id}` : `hollis-push-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath = event.notification.data?.url || "/";
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            client.focus();
            if ("navigate" in client) {
              return client.navigate(targetUrl);
            }
            return client;
          }
        }
        // If no matching window is open, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
