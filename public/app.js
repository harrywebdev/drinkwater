// Service Worker registration and push notification handling

const STORAGE_KEY_ID = "drinkwater_subscription_id";
const STORAGE_KEY_SUBSCRIBED = "drinkwater_subscribed";

let vapidPublicKey = null;

// DOM elements
const subscribeBtn = document.getElementById("subscribe-btn");
const unsubscribeBtn = document.getElementById("unsubscribe-btn");
const testBtn = document.getElementById("test-btn");
const statusMessage = document.getElementById("status-message");

// Initialize app
async function init() {
  // Check if service workers are supported
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    showStatus(
      "Push notifikace nejsou ve vašem prohlížeči podporovány.",
      "error",
    );
    subscribeBtn.disabled = true;
    return;
  }

  // Register service worker
  try {
    const registration =
      await navigator.serviceWorker.register("/service-worker.js");
    console.log("Service Worker registered:", registration);

    // Get VAPID public key from server
    vapidPublicKey = await fetchVapidPublicKey();

    // Check current subscription status
    await updateUI();
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    showStatus("Inicializace selhala. Prosím obnovte stránku.", "error");
  }
}

// Fetch VAPID public key from server
async function fetchVapidPublicKey() {
  try {
    const response = await fetch("/api/vapid-public-key");
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error("Failed to fetch VAPID public key:", error);
    throw error;
  }
}

// Update UI based on subscription status
async function updateUI() {
  const subscriptionId = localStorage.getItem(STORAGE_KEY_ID);
  const isSubscribed = localStorage.getItem(STORAGE_KEY_SUBSCRIBED) === "true";

  if (isSubscribed && subscriptionId) {
    // Check if subscription still exists
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // User is subscribed
      subscribeBtn.style.display = "none";
      unsubscribeBtn.style.display = "inline-flex";
      testBtn.style.display = "inline-flex";
      showStatus("Připomínky pití vody jsou zapnuté! 💧", "success");
    } else {
      // Subscription doesn't exist, clear local storage
      clearSubscriptionData();
      subscribeBtn.style.display = "inline-flex";
      unsubscribeBtn.style.display = "none";
      testBtn.style.display = "none";
    }
  } else {
    // User is not subscribed
    subscribeBtn.style.display = "inline-flex";
    unsubscribeBtn.style.display = "none";
    testBtn.style.display = "none";
  }
}

// Subscribe to push notifications
async function subscribe() {
  try {
    subscribeBtn.disabled = true;
    showStatus("Žádám o povolení notifikací...", "info");

    // Request notification permission
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      showStatus(
        "Povolení notifikací zamítnuto. Prosím povolte notifikace v nastavení prohlížeče.",
        "error",
      );
      subscribeBtn.disabled = false;
      return;
    }

    showStatus("Vytvářím odběr...", "info");

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Get user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Send subscription to server
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        timezone: timezone,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save subscription on server");
    }

    const data = await response.json();

    // Save subscription ID to localStorage
    localStorage.setItem(STORAGE_KEY_ID, data.id);
    localStorage.setItem(STORAGE_KEY_SUBSCRIBED, "true");

    showStatus(
      "Úspěšně zapnuto! Budete dostávat připomínky každou hodinu od 8:00 do 20:00. 🎉",
      "success",
    );
    await updateUI();
  } catch (error) {
    console.error("Subscription failed:", error);
    showStatus("Zapnutí selhalo. Prosím zkuste to znovu.", "error");
    subscribeBtn.disabled = false;
  }
}

// Unsubscribe from push notifications
async function unsubscribe() {
  try {
    unsubscribeBtn.disabled = true;
    showStatus("Vypínám připomínky...", "info");

    const subscriptionId = localStorage.getItem(STORAGE_KEY_ID);

    // Unsubscribe from push manager
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
    }

    // Remove subscription from server
    if (subscriptionId) {
      await fetch("/api/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: subscriptionId }),
      });
    }

    // Clear local storage
    clearSubscriptionData();

    showStatus("Úspěšně vypnuto. Připomínky už nebudete dostávat.", "info");
    subscribeBtn.disabled = false;
    await updateUI();
  } catch (error) {
    console.error("Unsubscribe failed:", error);
    showStatus("Vypnutí selhalo. Prosím zkuste to znovu.", "error");
  } finally {
    unsubscribeBtn.disabled = false;
  }
}

// Clear subscription data from localStorage
function clearSubscriptionData() {
  localStorage.removeItem(STORAGE_KEY_ID);
  localStorage.removeItem(STORAGE_KEY_SUBSCRIBED);
}

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type} show`;

  // Auto-hide success messages after 5 seconds
  if (type === "success" || type === "info") {
    setTimeout(() => {
      statusMessage.classList.remove("show");
    }, 5000);
  }
}

// Convert VAPID public key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Send test notification
async function sendTestNotification() {
  try {
    testBtn.disabled = true;
    showStatus("Odesílám testovací notifikaci...", "info");

    const subscriptionId = localStorage.getItem(STORAGE_KEY_ID);

    if (!subscriptionId) {
      showStatus("Odběr nenalezen. Prosím zapněte si připomínky.", "error");
      testBtn.disabled = false;
      return;
    }

    const response = await fetch("/api/test-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: subscriptionId }),
    });

    if (!response.ok) {
      throw new Error("Failed to send test notification");
    }

    showStatus(
      "Testovací notifikace odeslána! Zkontrolujte notifikace. 🔔",
      "success",
    );
  } catch (error) {
    console.error("Test notification failed:", error);
    showStatus(
      "Odeslání testovací notifikace selhalo. Zkuste to znovu.",
      "error",
    );
  } finally {
    testBtn.disabled = false;
  }
}

// Event listeners
subscribeBtn.addEventListener("click", subscribe);
unsubscribeBtn.addEventListener("click", unsubscribe);
testBtn.addEventListener("click", sendTestNotification);

// Initialize app when DOM is loaded
init();
