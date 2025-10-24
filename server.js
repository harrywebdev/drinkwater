require("dotenv").config();

const express = require("express");
const webpush = require("web-push");
const cron = require("node-cron");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { generateText } = require("ai");
const { groq } = require("@ai-sdk/groq");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// In-memory storage for subscriptions
const subscriptions = new Map();

// Configuration
const REMINDER_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; // 8am-8pm
const WINDOW_MINUTES = 15; // ±15 minutes around each hour
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Localized content
const FALLBACK_MESSAGES = {
  cs: ["Neboj se, napij se!", "Kdo nepije, nežije!", "Kde bys byl, kdyby ses nenapil?"],
  en: ["Time to hydrate!", "Drink up!", "Stay refreshed!"],
};

const NOTIFICATION_TITLES = {
  cs: "Připomínka pití vody",
  en: "Water reminder",
};

const AI_PROMPTS = {
  cs: `Vytvoř krátkou, přátelskou připomínku pití vody do 8 slov (česky).
Buď kreativní, nenucený, zábavný. Nepoužívej emoji. Vrať pouze text zprávy, nic víc.

Příklady dobrých zpráv:
- "Je čas se napít! Tvoje tělo ti poděkuje"
- "Zůstaň svěží – dej si teď vodu"
- "Neboj se, napij se!"
- "Kdo nepije, nežije!"
- "Kde bys byla, kdyby ses nenapila?"

Vygeneruj jednu jedinečnou zprávu:`,
  en: `Generate a short, friendly water reminder in 10 words or less.
Be creative, encouraging, and casual. Make it feel personal and motivating.
Don't use emojis. Just return the message text, nothing else.

Examples of good messages:
- "Time to hydrate! Your body will thank you"
- "Quick water break? You deserve it"
- "Stay refreshed - grab some water now"
- "Hydration check! Let's drink up"

Generate one unique message:`,
};

// Generate VAPID keys (in production, store these securely)
// Run this once: console.log(webpush.generateVAPIDKeys());
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  "BNxSB5ap-W6FWLqEpUqkF7FcF2JZF-P0VHh9D9D0wR2uJhL6HXm7LnqJ5BH-gKqQ9VCl0xMZqNZMZ9ZqZ0Z0Z0Z";
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || "your-private-key-here";

// If no VAPID keys are set, generate new ones
if (
  VAPID_PUBLIC_KEY ===
  "BNxSB5ap-W6FWLqEpUqkF7FcF2JZF-P0VHh9D9D0wR2uJhL6HXm7LnqJ5BH-gKqQ9VCl0xMZqNZMZ9ZqZ0Z0Z0Z"
) {
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log("\n=== VAPID KEYS GENERATED ===");
  console.log("Public Key:", vapidKeys.publicKey);
  console.log("Private Key:", vapidKeys.privateKey);
  console.log("\nSet these as environment variables:");
  console.log(`export VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
  console.log(`export VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
  console.log("===========================\n");

  webpush.setVapidDetails(
    "mailto:example@yourdomain.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey,
  );
} else {
  webpush.setVapidDetails(
    "mailto:example@yourdomain.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
}

// Helper function to map locale to supported language
function mapLocaleToLanguage(locale) {
  if (!locale) return "en";

  // Extract base language (cs_CZ → cs, en_US → en)
  const baseLang = locale.split("_")[0].toLowerCase();

  // Check if it's Czech
  if (baseLang === "cs") {
    return "cs";
  }

  // Default to English for everything else
  return "en";
}

// API Routes

// Get VAPID public key
app.get("/api/vapid-public-key", (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Subscribe to notifications
app.post("/api/subscribe", (req, res) => {
  try {
    const { subscription, timezone, locale } = req.body;

    if (!subscription || !timezone) {
      return res
        .status(400)
        .json({ error: "Missing subscription or timezone" });
    }

    const id = uuidv4();
    const subscriptionData = {
      id,
      subscription,
      timezone,
      locale: locale || "en_US", // Store full locale (e.g., 'cs_CZ', 'en_US')
      subscribedAt: new Date(),
      lastNotificationSent: null,
    };

    subscriptions.set(id, subscriptionData);

    const lang = mapLocaleToLanguage(locale);
    console.log(`New subscription added: ${id} (Timezone: ${timezone}, Locale: ${locale}, Lang: ${lang})`);
    console.log(`Total subscriptions: ${subscriptions.size}`);

    res.status(201).json({ id });
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// Unsubscribe from notifications
app.post("/api/unsubscribe", (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing subscription id" });
    }

    if (subscriptions.has(id)) {
      subscriptions.delete(id);
      console.log(`Subscription removed: ${id}`);
      console.log(`Total subscriptions: ${subscriptions.size}`);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Subscription not found" });
    }
  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
});

// Get subscription status (for debugging)
app.get("/api/status", (req, res) => {
  res.json({
    totalSubscriptions: subscriptions.size,
    serverTime: new Date().toISOString(),
  });
});

// Send test notification
app.post("/api/test-notification", async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing subscription id" });
    }

    const subscriptionData = subscriptions.get(id);

    if (!subscriptionData) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const success = await sendNotification(subscriptionData);

    if (success) {
      console.log(`Test notification sent to ${id}`);
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Failed to send notification" });
    }
  } catch (error) {
    console.error("Test notification error:", error);
    res.status(500).json({ error: "Failed to send test notification" });
  }
});

// Helper function to get current hour in user's timezone
function getCurrentHourInTimezone(timezone) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(new Date()));
  } catch (error) {
    console.error(`Invalid timezone: ${timezone}`, error);
    return null;
  }
}

// Helper function to get current time parts in user's timezone
function getTimeInTimezone(timezone) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === "hour").value);
    const minute = parseInt(parts.find((p) => p.type === "minute").value);

    return { hour, minute };
  } catch (error) {
    console.error(`Error getting time in timezone: ${timezone}`, error);
    return null;
  }
}

// Helper function to check if current time is within notification window
function isInNotificationWindow(timezone) {
  const time = getTimeInTimezone(timezone);
  if (!time) return { shouldNotify: false };

  const { hour, minute } = time;

  // Check if we're in the window for any reminder hour
  for (const reminderHour of REMINDER_HOURS) {
    // Window is from (hour-1):45 to hour:15
    const inWindow =
      (hour === reminderHour - 1 && minute >= 60 - WINDOW_MINUTES) || // Previous hour, last 15 mins
      (hour === reminderHour && minute <= WINDOW_MINUTES); // Current hour, first 15 mins

    if (inWindow) {
      return { shouldNotify: true, targetHour: reminderHour };
    }
  }

  return { shouldNotify: false };
}

// Helper function to check if notification was already sent for this hour
function wasNotificationSentThisHour(lastSent, targetHour, timezone) {
  if (!lastSent) return false;

  try {
    const lastSentTime = getTimeInTimezone(timezone);
    const lastSentDate = new Date(lastSent);

    // Check if last notification was sent less than 50 minutes ago
    // This prevents duplicate notifications in the same hour window
    const fiftyMinutesAgo = new Date(Date.now() - 50 * 60 * 1000);

    if (lastSentDate > fiftyMinutesAgo) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

// Generate AI-powered water reminder message
async function generateWaterReminderMessage(locale) {
  // Map locale to supported language
  const lang = mapLocaleToLanguage(locale);

  // If no Groq API key, use fallback messages
  if (!GROQ_API_KEY || GROQ_API_KEY === "your-groq-api-key-here") {
    const messages = FALLBACK_MESSAGES[lang];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  try {
    const { text } = await generateText({
      // https://console.groq.com/docs/models
      model: groq("llama-3.3-70b-versatile"),
      prompt: AI_PROMPTS[lang],
      maxTokens: 500,
      temperature: 0.9,
    });

    console.log(`AI message generated (${lang}):`, text);

    // Clean up the response and ensure it's not too long
    const cleanMessage = text.trim().replace(/^["']|["']$/g, "");

    const finalMessage =
      cleanMessage.length > 60
        ? cleanMessage.substring(0, 60) + "..."
        : cleanMessage;

    if (!finalMessage) {
      const messages = FALLBACK_MESSAGES[lang];
      return messages[Math.floor(Math.random() * messages.length)];
    }

    return finalMessage;
  } catch (error) {
    console.error(
      "AI message generation failed, using fallback:",
      error.message,
    );
    // Fallback to predefined messages in correct language
    const messages = FALLBACK_MESSAGES[lang];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}

// Send notification to a subscription
async function sendNotification(subscriptionData) {
  const { id, subscription, timezone, locale } = subscriptionData;

  // Map locale to supported language
  const lang = mapLocaleToLanguage(locale);

  // Generate AI-powered message in user's language
  const message = await generateWaterReminderMessage(locale);

  // Use localized notification title
  const title = NOTIFICATION_TITLES[lang];

  const payload = JSON.stringify({
    title: title,
    body: message,
    icon: "/ios/192.png",
    badge: "/ios/192.png",
    timestamp: Date.now(),
  });

  try {
    await webpush.sendNotification(subscription, payload);
    subscriptions.get(id).lastNotificationSent = new Date();
    console.log(`Notification sent to ${id} (${timezone}, ${lang}): "${message}"`);
    return true;
  } catch (error) {
    console.error(`Failed to send notification to ${id}:`, error);

    // If subscription is expired or invalid (410 Gone), remove it
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log(`Removing invalid subscription: ${id}`);
      subscriptions.delete(id);
    }

    return false;
  }
}

// Scheduler - runs every minute
cron.schedule("* * * * *", async () => {
  if (subscriptions.size === 0) return;

  console.log(
    `Checking notifications... (${subscriptions.size} subscriptions)`,
  );

  for (const [id, subscriptionData] of subscriptions) {
    const { timezone, lastNotificationSent } = subscriptionData;

    // Check if we're in a notification window
    const { shouldNotify, targetHour } = isInNotificationWindow(timezone);

    if (shouldNotify) {
      // Check if we already sent a notification for this hour
      if (
        !wasNotificationSentThisHour(lastNotificationSent, targetHour, timezone)
      ) {
        // Random chance to send within the window (creates randomness)
        // Higher chance as we progress through the window
        const randomChance = Math.random();
        if (randomChance < 0.1) {
          // 10% chance per minute = spread across ~10 minutes
          await sendNotification(subscriptionData);
        }
      }
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n💧 Drink Water Reminder Server`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    `\nNotification schedule: Every hour from 8am to 8pm (user's timezone)`,
  );
  console.log(`Random window: ±${WINDOW_MINUTES} minutes around each hour\n`);
});
