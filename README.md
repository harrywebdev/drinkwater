# 💧 Drink Water Reminder

A Progressive Web App (PWA) that sends push notifications to remind you to drink water throughout the day. Compatible with iOS, Android, and desktop browsers.

## Features

- 🔔 Hourly push notifications from 8 AM to 8 PM
- 🌍 Automatic timezone detection
- 🤖 AI-generated reminder messages (powered by Groq)
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
- Groq API key (free tier available at [console.groq.com](https://console.groq.com))

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

On first run, the server will automatically generate VAPID keys and display them in the console. For production, you should save these keys:

#### Option 1: Using .env file (Recommended)

1. Copy `env.example` to `.env`:

   ```bash
   cp env.example .env
   ```

2. Run the server once to generate keys:

   ```bash
   npm start
   ```

3. Copy the generated keys from the console into your `.env` file:

   ```
   VAPID_PUBLIC_KEY="your-generated-public-key"
   VAPID_PRIVATE_KEY="your-generated-private-key"
   ```

4. Get a Groq API key:
   - Visit [console.groq.com](https://console.groq.com)
   - Sign up for free
   - Create an API key
   - Add to your `.env` file:

   ```
   GROQ_API_KEY="gsk_..."
   ```

5. Restart the server

**Note:** If no Groq API key is provided, the app will fall back to predefined messages.

#### Option 2: Using environment variables

Set them directly in your shell:

```bash
export VAPID_PUBLIC_KEY="your-public-key"
export VAPID_PRIVATE_KEY="your-private-key"
```

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
    "timezone": "America/New_York",
    "locale": "en_US"
  }
  ```
- `POST /api/unsubscribe` - Unsubscribe from notifications
  ```json
  {
    "id": "subscription-uuid"
  }
  ```
- `GET /api/status` - Get server status and subscription count
- `POST /api/test-notification` - Send a test notification (for debugging)
- `POST /api/notify-resubscribe` - Send resubscribe notification to all users (for pre-deployment)

## Project Structure

```
drinkwater/
├── server.js                 # Express server + notification scheduler
├── package.json             # Dependencies
├── env.example             # Environment variables template
├── .env                    # Your local environment variables (create from env.example)
├── .gitignore             # Git ignore rules
├── README.md               # This file
├── DEPLOYMENT.md          # Deployment guide with pre-deployment notifications
├── notify-before-deploy.sh # Pre-deployment notification script
└── public/                 # Static files
    ├── index.html         # Main app page
    ├── styles.css         # Styling
    ├── app.js            # Frontend logic
    ├── i18n.js           # Internationalization (Czech/English)
    ├── service-worker.js  # Push notification handler
    ├── manifest.json     # PWA manifest
    └── ios/            # iOS icons
```

## Browser Compatibility

- ✅ **iOS Safari 16.4+** (requires Add to Home Screen)
- ✅ **Chrome/Edge** (desktop & mobile)
- ✅ **Firefox** (desktop & mobile)
- ✅ **Samsung Internet**
- ❌ **iOS Safari in-browser** (iOS limitation - must add to Home Screen)

## Deployment

### ⚠️ Important: Pre-deployment Notifications

Since subscriptions are stored in memory, **they will be lost when you deploy a new version**. To minimize disruption, send a notification to all users before deploying:

```bash
# Run this BEFORE deploying
./notify-before-deploy.sh

# Or for production
./notify-before-deploy.sh https://your-production-url.fly.dev
```

This will:

1. Send a notification to all users: "Your subscription will expire soon. Tap to re-subscribe."
2. When tapped, users will be prompted to re-subscribe
3. Their subscription data will be cleared automatically

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Option 1: Traditional Hosting (Heroku, Railway, etc.)

1. Set environment variables in your hosting platform:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `GROQ_API_KEY` (optional, but recommended for AI messages)
2. **Before deploying**, run `./notify-before-deploy.sh https://your-app-url.com`
3. Wait 2-5 minutes for users to receive notifications
4. Deploy the app
5. Ensure HTTPS is enabled (required for push notifications)

**Note:** Don't commit your `.env` file to version control!

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

### AI Message Generation

- Uses Groq's `llama-3.3-70b-versatile` model for fast, creative messages
- Each notification gets a unique, personalized message
- Fallback to predefined messages if AI fails or no API key is set
- Average generation time: ~200-500ms
- Messages are limited to 60 characters for notification compatibility

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
- Customize AI prompt for different message styles
- Add water intake tracking
- Persistent storage with Redis/database
- User-configurable schedules
- Use different LLM models (GPT-4, Claude, etc.)

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!

---

**Stay hydrated! 💧**
