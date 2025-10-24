# Deployment Guide

## Problem

When deploying a new version of the server, all subscriptions stored in memory are lost. This means users will stop receiving notifications until they manually re-subscribe.

## Solution

Before each deployment, send a notification to all subscribers telling them to re-subscribe. When they tap the notification, the app will:
1. Open automatically
2. Clear their local subscription data
3. Show a message prompting them to re-subscribe

## How to Use

### Option 1: Using the Shell Script (Recommended)

1. **Before deployment**, run the notification script:

```bash
# For local server
./notify-before-deploy.sh

# For production server
./notify-before-deploy.sh https://your-production-url.fly.dev
```

2. **Wait 2-5 minutes** for users to receive and potentially tap the notification

3. **Deploy your new version** as usual

### Option 2: Manual API Call

You can also manually trigger the notification endpoint:

```bash
# Local
curl -X POST http://localhost:3000/api/notify-resubscribe

# Production
curl -X POST https://your-production-url.fly.dev/api/notify-resubscribe
```

The response will show how many notifications were sent:

```json
{
  "total": 150,
  "sent": 148,
  "failed": 2
}
```

### Option 3: One-line Pre-deployment Command

```bash
# Add this to your deployment script or run it manually before deploying
curl -X POST https://your-production-url.fly.dev/api/notify-resubscribe && sleep 60 && fly deploy
```

This will:
1. Send notifications to all users
2. Wait 60 seconds
3. Deploy the new version

## What Users Experience

1. **They receive a notification**:
   - English: "Server Update - Your subscription will expire soon. Tap to re-subscribe."
   - Czech: "Aktualizace serveru - Váš odběr brzy vyprší. Klepněte pro opětovné zapnutí připomínek."

2. **When they tap the notification**:
   - The app opens automatically
   - Their old subscription data is cleared
   - They see a message: "Your subscription expired due to server update. Please subscribe again."
   - The subscribe button is ready for them to tap

3. **They tap "Subscribe to Reminders"**:
   - A new subscription is created
   - They continue receiving notifications as before

## Testing Locally

Before using this in production, you can test the flow locally:

1. **Start your local server**:
   ```bash
   npm start
   ```

2. **Subscribe to notifications** in your browser (http://localhost:3000)

3. **Run the notification script**:
   ```bash
   ./notify-before-deploy.sh
   ```

4. **You should receive a notification** saying:
   - "Server Update - Your subscription will expire soon. Tap to re-subscribe."

5. **Tap the notification**:
   - Browser opens to the app
   - You see: "Your subscription expired due to server update. Please subscribe again."
   - Your local storage is cleared
   - Subscribe button is ready

6. **Re-subscribe** by clicking the button

7. **Verify everything works** by sending a test notification

## Deployment Checklist

- [ ] Run `./notify-before-deploy.sh` (or use the API endpoint)
- [ ] Wait 2-5 minutes
- [ ] Deploy new version
- [ ] After deployment, check `/api/status` to see new subscriptions coming in
- [ ] Monitor logs for any errors

## Future Improvements

Consider implementing persistent storage for subscriptions:
- Database (PostgreSQL, MongoDB, etc.)
- Redis
- File-based storage

This would eliminate the need for pre-deployment notifications entirely.

## Technical Details

### Files Modified

1. **`server.js`**:
   - Added `/api/notify-resubscribe` endpoint
   - Added `sendResubscribeNotification()` function
   - Added `RESUBSCRIBE_MESSAGES` for localized messaging

2. **`public/app.js`**:
   - Added URL parameter detection (`?resubscribe=1`)
   - Clears local storage when parameter is detected
   - Shows resubscribe prompt

3. **`public/service-worker.js`**:
   - Updated to accept `url` in notification payload
   - Opens specified URL when notification is tapped

4. **`public/i18n.js`**:
   - Added `status.resubscribeNeeded` translations

### API Endpoint

**POST** `/api/notify-resubscribe`

Sends a special notification to all current subscribers with:
- Localized message (Czech/English)
- URL parameter `?resubscribe=1`
- Instructions to re-subscribe

**Response**:
```json
{
  "total": 150,
  "sent": 148,
  "failed": 2
}
```

### URL Parameter

`?resubscribe=1` - When present, triggers:
1. Clearing of `localStorage` subscription data
2. Display of resubscribe prompt
3. Automatic cleanup of URL (removed from address bar)

