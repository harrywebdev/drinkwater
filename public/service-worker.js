// Service Worker for handling push notifications

self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("Push notification received");

  let data = {
    title: "Water reminder",
    body: "Stay hydrated!",
    icon: "/ios/192.png",
    badge: "/ios/192.png",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error("Error parsing push data:", e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/ios/192.png",
    badge: data.badge || "/ios/192.png",
    vibrate: [200, 100, 200],
    tag: "drinkwater-reminder",
    requireInteraction: false,
    renotify: true,
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.timestamp || Date.now(),
      url: data.url || "/", // Store URL from notification payload
    },
    actions: [
      {
        action: "done",
        title: "Done ✓",
      },
      {
        action: "close",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.action);

  event.notification.close();

  // If user clicks on notification (not action button), open the app
  if (event.action === "" || event.action === "done") {
    // Get URL from notification data (defaults to "/")
    const url = event.notification.data?.url || "/";
    event.waitUntil(clients.openWindow(url));
  }
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed");
});
