// i18n - Internationalization for Drink Water Reminder

const translations = {
  cs: {
    page: {
      title: "Připomínka pití vody",
      subtitle: "Zůstaňte hydratovaní po celý den",
    },
    info: {
      text: "Dostávejte přátelské připomínky každou hodinu od <strong>8:00 do 20:00</strong> ve vašem časovém pásmu.",
    },
    buttons: {
      subscribe: "Zapnout připomínky",
      unsubscribe: "Vypnout",
      sendNow: "Odeslat teď",
      sendNowTitle: "Odeslat testovací notifikaci",
    },
    features: {
      hourly: "Každou hodinu",
      timezone: "Vaše časové pásmo",
      iosCompatible: "iOS kompatibilní",
    },
    iosNotice:
      "<strong>iOS uživatelé:</strong> Přidejte aplikaci na plochu, aby notifikace správně fungovaly.",
    footer: "💧 Zůstaňte hydratovaní, zůstaňte zdraví",
    status: {
      notSupported: "Push notifikace nejsou ve vašem prohlížeči podporovány.",
      initFailed: "Inicializace selhala. Prosím obnovte stránku.",
      subscribed: "Připomínky pití vody jsou zapnuté! 💧",
      requestingPermission: "Žádám o povolení notifikací...",
      permissionDenied:
        "Povolení notifikací zamítnuto. Prosím povolte notifikace v nastavení prohlížeče.",
      creatingSubscription: "Vytvářím odběr...",
      subscribeSuccess:
        "Úspěšně zapnuto! Budete dostávat připomínky každou hodinu od 8:00 do 20:00. 🎉",
      subscribeFailed: "Zapnutí selhalo. Prosím zkuste to znovu.",
      unsubscribing: "Vypínám připomínky...",
      unsubscribeSuccess: "Úspěšně vypnuto. Připomínky už nebudete dostávat.",
      unsubscribeFailed: "Vypnutí selhalo. Prosím zkuste to znovu.",
      sendingTest: "Odesílám testovací notifikaci...",
      testNotFound: "Odběr nenalezen. Prosím zapněte si připomínky.",
      testSuccess: "Testovací notifikace odeslána! Zkontrolujte notifikace. 🔔",
      testFailed: "Odeslání testovací notifikace selhalo. Zkuste to znovu.",
      resubscribeNeeded:
        "Váš odběr vypršel kvůli aktualizaci serveru. Prosím, za několik minut zapněte připomínky znovu. 🔄",
    },
  },
  en: {
    page: {
      title: "Water Reminder",
      subtitle: "Stay hydrated throughout your day",
    },
    info: {
      text: "Get friendly reminders every hour from <strong>8 AM to 8 PM</strong> in your local timezone.",
    },
    buttons: {
      subscribe: "Subscribe to Reminders",
      unsubscribe: "Unsubscribe",
      sendNow: "Send now",
      sendNowTitle: "Send a test notification now",
    },
    features: {
      hourly: "Hourly reminders",
      timezone: "Your timezone",
      iosCompatible: "iOS compatible",
    },
    iosNotice:
      "<strong>iOS Users:</strong> Add this app to your Home Screen for notifications to work properly.",
    footer: "💧 Stay hydrated, stay healthy",
    status: {
      notSupported: "Push notifications are not supported in your browser.",
      initFailed: "Failed to initialize. Please refresh the page.",
      subscribed: "You are subscribed to water reminders! 💧",
      requestingPermission: "Requesting notification permission...",
      permissionDenied:
        "Notification permission denied. Please enable notifications in your browser settings.",
      creatingSubscription: "Creating subscription...",
      subscribeSuccess:
        "Successfully subscribed! You will receive hourly reminders from 8 AM to 8 PM. 🎉",
      subscribeFailed: "Subscription failed. Please try again.",
      unsubscribing: "Unsubscribing...",
      unsubscribeSuccess:
        "Successfully unsubscribed. You will no longer receive reminders.",
      unsubscribeFailed: "Unsubscribe failed. Please try again.",
      sendingTest: "Sending test notification...",
      testNotFound: "No subscription found. Please subscribe first.",
      testSuccess: "Test notification sent! Check your notifications. 🔔",
      testFailed: "Failed to send test notification. Please try again.",
      resubscribeNeeded:
        "Your subscription expired due to server update. Please subscribe again in a few minutes. 🔄",
    },
  },
};

// Get full browser locale (e.g., 'cs_CZ', 'en_US', 'pt_BR')
function getFullBrowserLanguage() {
  const browserLang = navigator.language || navigator.languages?.[0] || "en-US";
  // Convert dash to underscore (cs-CZ → cs_CZ)
  return browserLang.replace("-", "_");
}

// Map locale to supported language ('cs' or 'en')
function mapToSupportedLanguage(locale) {
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

// Get translation for a key
function t(key, lang) {
  const keys = key.split(".");
  let value = translations[lang];

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation missing for key: ${key} (lang: ${lang})`);
      return key;
    }
  }

  return value;
}

// Get translations object for a language
function getTranslations(lang) {
  return translations[lang] || translations.en;
}
