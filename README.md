# Twitch Helpers

A Google Apps Script project that automates Twitch notifications and clip management using Google Sheets as a database and Discord webhooks for notifications.

## Features

- 🎬 **Clips Sync & Notification**: Automatically fetch Twitch clips and sync them to Google Sheets, then send Discord notifications for new clips
- 🔴 **Live Stream Notifications**: Monitor Twitch channels and send Discord notifications when streamers go live
- 📊 **Google Sheets Integration**: Use Google Sheets as a simple database to track clips and prevent duplicate notifications
- 🔧 **Configurable**:  Easy configuration through config files

## Project Structure

```
.
├── Config.gs                      # Configuration for Twitch API and Google Sheets
├── common.gs                      # Common utility functions (Twitch API helpers)
├── notificationForClips.gs        # Clip notification automation
├── notificationForStreaming.gs    # Live stream notification automation
├── syncClipsToSheet.gs           # Sync Twitch clips to Google Sheets
└── README.md                      # This file
```

## Setup

### 1. Prerequisites

- A Google account with access to Google Apps Script
- A Twitch Developer account
- Discord webhook URLs for notifications
- A Google Spreadsheet to use as a database

### 2. Get Twitch API Credentials

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Create a new application
3. Note down your **Client ID** and **Client Secret**

### 3. Create Google Spreadsheet

1. Create a new Google Spreadsheet
2. Create a sheet with the name of the Twitch user you want to track
3. Add the following headers in the first row:
   - A: ID
   - B: Broadcaster
   - C: Title
   - D: View Count
   - E: Created At
   - F:  URL
   - G: Is Sent
   - H: Updated At
   - I: Thumbnail
   - J: Creator
4. Note down the **Spreadsheet ID** (from the URL)

### 4. Get Discord Webhook URLs

1. Go to your Discord server settings
2. Navigate to **Integrations > Webhooks**
3. Create new webhooks for clip and streaming notifications
4. Copy the webhook URLs

### 5. Configure the Project

Edit `Config.gs`:

```javascript
const DB_CONFIG = {
  SPREADSHEET_ID: 'your_google_sheet_id_here',
};

const TWITCH_CONFIG = {
  CLIENT_ID:  'your_twitch_client_id',
  CLIENT_SECRET: 'your_twitch_client_secret',
};
```

Edit `notificationForClips.gs`:

```javascript
const CLIP_USER = 'twitch_username';
const CLIP_DC_WEBHOOK = 'your_discord_webhook_url';
```

Edit `notificationForStreaming.gs`:

```javascript
const STREAMING_USER = 'twitch_username';
const STREAMING_DC_WEBHOOK = 'your_discord_webhook_url';
```

### 6. Create Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Copy all `.gs` files content to the script editor
4. Save the project

### 7. Set Up Triggers

1. In the Apps Script editor, click on the clock icon (Triggers)
2. Add triggers for automated execution:
   - **For Clips**: Set `routineMainClips` to run on a time-driven trigger (e.g., every hour)
   - **For Streaming**: Set `routineMainCheckLiveStatus` to run frequently (e.g., every 5-10 minutes)

## Usage

### Clip Notifications

The `routineMainClips()` function:
1. Syncs recent clips (last 24 hours) from Twitch to Google Sheets
2. Checks for unsent clips in the database
3. Sends Discord notifications for up to 5 clips per run (configurable via `PUSH_LIMIT`)
4. Marks clips as sent to avoid duplicates

**Manual execution**:
```javascript
routineMainClips();
```

### Live Stream Notifications

The `routineMainCheckLiveStatus()` function:
1. Checks if the streamer is currently live
2. Compares the current stream ID with the last known stream ID
3. Sends Discord notification only for new streams
4. Updates the stored stream ID to prevent duplicate notifications

**Manual execution**:
```javascript
routineMainCheckLiveStatus();
```

## Functions Reference

### Common Functions (`common.gs`)

- `getTwitchIdByName(username)`: Get Twitch user ID from username
- `getAppAccessToken()`: Get Twitch API access token

### Clip Functions

- `syncClipsToSheet(name)`: Fetch clips from Twitch and save to Google Sheets
- `pushUnsentClipsToDiscord(name)`: Check database and send unsent clips to Discord
- `sendClipToDiscordFromSheet(clip)`: Send a single clip notification to Discord

### Streaming Functions

- `routineMainCheckLiveStatus()`: Main function to check live status and send notifications
- `sendLiveNotificationToDiscord(stream)`: Send live notification to Discord

## Customization

### Adjust Clip Fetch Period

In `syncClipsToSheet. gs`, change the `days` variable:

```javascript
const days = 7; // Fetch clips from last 7 days
```

### Adjust View Count Filter

In `notificationForClips.gs`, modify the condition:

```javascript
if (isSent === false && viewCount >= 10) {  // Only send clips with 10+ views
```

### Adjust Clip Push Limit

In `notificationForClips.gs`, change `PUSH_LIMIT`:

```javascript
const PUSH_LIMIT = 10; // Send up to 10 clips per run
```

## Troubleshooting

### No clips are being synced
- Verify your Twitch API credentials are correct
- Check that the username exists on Twitch
- Ensure the time range includes clip creation dates

### Discord notifications not sending
- Verify webhook URLs are valid
- Check Discord server permissions
- Review Google Apps Script execution logs

### Duplicate notifications
- Ensure the "Is Sent" column (G) is being updated properly
- For streaming, check that Script Properties are being saved correctly

## License

This project is open source and available under the MIT License. 

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please open an issue on GitHub. 
