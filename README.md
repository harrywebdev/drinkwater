# 💧 Drink Water Reminder

A Progressive Web App (PWA) that sends push notifications to remind you to drink water throughout the day. Compatible with iOS, Android, and desktop browsers.

## Features

- 🔔 Hourly push notifications from 8 AM to 8 PM
- 🌍 Automatic timezone detection
- 🎲 Random reminder messages to keep it fresh
- 📱 iOS Safari compatible (requires Add to Home Screen)
- 🚀 No database required - subscriptions stored in memory
- 🎨 Modern, responsive UI

## How It Works

1. User visits the website and clicks "Subscribe to Reminders"
2. Browser requests notification permission
3. Service worker registers for push notifications
4. Backend stores subscription with user's timezone (in-memory)
5. Scheduler sends notifications randomly within ±15 minutes of each hour
6. Notifications display one of three random messages

## Setup Instructions

### Prerequisites

- Node.js 14+ installed
- HTTPS connection (required for push notifications)
  - Use localhost for development
  - Use a proper SSL certificate for production

### Installation

1. **Clone or navigate to the project directory:**

   ```bash
   cd drinkwater
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the server:**

   ```bash
   npm start
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

### First Run - VAPID Keys

On first run, the server will automatically generate VAPID keys and display them in the console. For production, you should:

1. Copy the generated keys from the console output
2. Set them as environment variables:
   ```bash
   export VAPID_PUBLIC_KEY="your-public-key"
   export VAPID_PRIVATE_KEY="your-private-key"
   ```
3. Or create a `.env` file (if you add dotenv support)

## Usage

### For Users

1. **Open the app** in your browser
2. **Click "Subscribe to Reminders"**
3. **Grant notification permission** when prompted
4. **For iOS users:** Add the app to your Home Screen:
   - Tap the Share button in Safari
   - Select "Add to Home Screen"
   - Open the app from your Home Screen

### For Developers

#### Configuration

Edit these constants in `server.js`:

```javascript
const REMINDER_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const WINDOW_MINUTES = 15; // ±15 minutes
const NOTIFICATION_MESSAGES = ["Drink now", "Do your drink", "Why not drink?"];
```

#### API Endpoints

- `GET /api/vapid-public-key` - Get VAPID public key for subscription
- `POST /api/subscribe` - Subscribe to notifications
  ```json
  {
    "subscription": {
      /* Push subscription object */
    },
    "timezone": "America/New_York"
  }
  ```
- `POST /api/unsubscribe` - Unsubscribe from notifications
  ```json
  {
    "id": "subscription-uuid"
  }
  ```
- `GET /api/status` - Get server status and subscription count

## Project Structure

```
drinkwater/
├── server.js                 # Express server + notification scheduler
├── package.json             # Dependencies
├── README.md               # This file
└── public/                 # Static files
    ├── index.html         # Main app page
    ├── styles.css         # Styling
    ├── app.js            # Frontend logic
    ├── service-worker.js  # Push notification handler
    ├── manifest.json     # PWA manifest
    └── icons/            # App icons
        ├── icon-192.png
        └── icon-512.png
```

## Browser Compatibility

- ✅ **iOS Safari 16.4+** (requires Add to Home Screen)
- ✅ **Chrome/Edge** (desktop & mobile)
- ✅ **Firefox** (desktop & mobile)
- ✅ **Samsung Internet**
- ❌ **iOS Safari in-browser** (iOS limitation - must add to Home Screen)

## Deployment

### Option 1: Traditional Hosting (Heroku, Railway, etc.)

1. Ensure VAPID keys are set as environment variables
2. Deploy the app
3. Ensure HTTPS is enabled (required for push notifications)

### Option 2: Local Network (for testing)

1. Run the server on your local machine
2. Access via `https://localhost:3000` or your local IP
3. For iOS testing, use ngrok or similar to expose localhost over HTTPS

## Troubleshooting

### Notifications not working on iOS

- ✅ Added app to Home Screen?
- ✅ Granted notification permission?
- ✅ Using HTTPS (or localhost)?
- ✅ Check iOS Settings > [App Name] > Notifications

### Notifications not sending

- Check server console for errors
- Verify subscription exists: `GET /api/status`
- Check timezone is correct
- Ensure current time is between 8 AM - 8 PM in user's timezone

### Service Worker not registering

- Must be served over HTTPS (or localhost)
- Check browser console for errors
- Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

## Technical Details

### Notification Timing

- Notifications are sent randomly within a ±15 minute window around each hour
- Example: For 2 PM notification, it could arrive between 1:45 PM - 2:15 PM
- Each subscription tracks last notification sent to prevent duplicates
- Scheduler runs every minute to check eligibility

### Data Storage

- Subscriptions stored in-memory (Map structure)
- Data is lost on server restart (by design)
- No persistence layer required
- Each subscription includes:
  - Unique ID (UUID)
  - Push subscription object
  - User's timezone
  - Last notification timestamp

### Security

- VAPID keys authenticate server with push service
- Subscriptions are unique per device/browser
- No personal data collected

## Customization Ideas

- Change notification frequency (every 30 minutes, every 2 hours, etc.)
- Add custom time ranges (e.g., 6 AM - 10 PM)
- More reminder messages
- Add water intake tracking
- Persistent storage with Redis/database
- User-configurable schedules

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!

---

**Stay hydrated! 💧**
