# Layedia - Social Media App

## Overview
Layedia is a full-stack social media application, similar to Facebook, available on both mobile and web platforms. It provides essential social networking functionalities such as posts, reactions, comments, friend connections, direct messaging, and real-time notifications. The vision for Layedia is to create a dynamic and engaging platform for users to connect and share, leveraging a modern tech stack for scalability and a rich user experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Smooth Page Transitions**: Utilizes various animated transitions (slide, modal, fade, tab, icon animations) for a fluid user experience, all leveraging native driver for 60fps performance.
- **Interactive Posts**: Tappable post content (text/media) opens full post detail views, with videos pausing and preserving playback position.
- **Custom Alert System**: Global, customizable, animated modal-based alert system with various types (success, error, warning, info).
- **iOS-Style Gaussian Blur Modals**: All modals feature a Gaussian blur backdrop using `expo-blur` for an enhanced visual aesthetic.
- **Verified Badge**: Displays for verified users across various lists and search results.
- **Aspect Ratio Media Display**: Images and videos are displayed with their original aspect ratio (no cropping or distortion). Media dimensions are stored in database and used to calculate aspect ratio for proper display.

### Frontend Architecture (React Native + Expo)
The mobile application uses React Native with Expo SDK. Navigation is handled by React Navigation (Stack and Bottom Tab navigators), and UI components are built with React Native Paper. State management primarily uses React Context API (AuthContext, AlertContext). Axios manages HTTP requests, Expo SecureStore provides secure token storage, and Expo Image Picker and Expo AV handle media.
- **Key Features**: Navigation flows (authenticated/unauthenticated), video playback (autoplay in feed, full controls on detail), user thoughts/notes (short notes with emojis in Messages screen), post reactions (single-tap like/unlike, long-press for menu), message reactions (long-press for emoji menu with push notifications), messaging streaks (TikTok-style mutual messaging streak system with animated fire icon and milestone badges), **real-time voice calls** (WebRTC-powered audio calls with mute/speaker controls, using STUN servers for peer-to-peer connectivity), **automatic APK updates** (OTA update system that checks for new versions on startup, auto-downloads and installs APKs with progress tracking), **message backup & restore** (Zalo-style dual-storage architecture where messages are stored in database for 24h and local storage permanently, with Google Drive backup/restore functionality).

### Backend Architecture (Node.js + Express)
The backend is a RESTful API built with Node.js and Express, following an MVC-like structure. It uses JWT for stateless authentication with bcrypt for password hashing and Express-validator for request validation.
- **Key Features**:
  - **Media Storage**: Cloudinary for cloud-based storage of images and videos. Media dimensions (width/height) are captured from Cloudinary on upload and stored in database for aspect ratio calculations.
  - **Privacy & Visibility**: Posts support `public` and `friends` privacy settings.
  - **Anti-Spindown System**: Automatic keep-alive mechanism for Render.com deployment.
  - **Dual Database System**: Supports primary and secondary PostgreSQL databases for redundancy. Writes go to primary with failover to secondary. Reads query both databases and merge results, ensuring data consistency and availability.
  - **Auto-Reaction System**: Automated service that adds gradual, natural reactions from 100 fake Vietnamese accounts to new posts. Reactions are distributed realistically (Like 40%, Love 30%, Haha 15%, Wow 10%, Sad 5%) with timing between 5 seconds to 3 minutes. Service runs in background and checks for new posts every 10 seconds.
  - **WebRTC Signaling**: Socket.IO server handles WebRTC signaling for voice calls, relaying SDP offers/answers and ICE candidates between call participants.
  - **APK Version Management**: Admin interface at `/apk-manager` for uploading new APK versions with version codes and release notes. Mobile app checks version on startup and auto-downloads/installs updates. Supports force updates and stores APK files in `/uploads/apk/` directory.
  - **Message Cleanup Service**: Automated cron job that runs every 6 hours to delete messages older than 24 hours from the database, following Zalo's message retention policy. Messages remain in local storage on users' devices.
  - **Google Drive Integration**: Secure backup/restore system using Replit's Google Drive connector. Users can backup all messages to their personal Google Drive and restore them when switching devices or reinstalling the app.

### Web Platform Architecture
A separate web version is created from the mobile codebase using Expo Web (React Native Web).
- **Web-Specific Adaptations**: Uses `localStorage` instead of `expo-secure-store`, push notifications are disabled.
- **Key Features on Web**: User authentication, profiles, news feed, stories, friend management, image/video upload. Messaging, voice calls, and push notifications are not available on the web.

## External Dependencies

### Database
- **PostgreSQL**: Primary relational database, hosted on Neon. Schema includes tables for users, posts (with media_width/media_height columns for aspect ratio), comments, reactions, friendships, messages, message_reactions, message_streaks, notifications, user_thoughts, stories, push_tokens, and app_versions (for APK update management).
- **Fake Accounts**: 100 Vietnamese fake user accounts (emails: @fake.com, password: FakeUser123) for auto-reaction system. These accounts don't trigger notifications.

### Third-Party Services & APIs
- **Expo Services**: SecureStore, Image Picker, AV, Constants, FileSystem (for APK downloads), IntentLauncher (for APK installation), AsyncStorage (for local message storage).
- **Cloudinary**: Cloud-based media storage and delivery.
- **Multer**: File upload middleware (backend - handles media uploads and APK files).
- **JWT (jsonwebtoken)**: Token generation and verification (backend).
- **Bcrypt**: Password hashing (backend).
- **Axios**: HTTP client for keep-alive pings (backend).
- **WebRTC**: Real-time peer-to-peer audio communication using `react-native-webrtc` for media streams and RTCPeerConnection, with `react-native-incall-manager` for audio routing (earpiece/speaker control). Uses Google STUN servers for NAT traversal.
- **Google APIs (googleapis)**: Google Drive API v3 for message backup/restore functionality, using OAuth2 credentials managed by Replit's integration system.
- **Node-cron**: Scheduled task runner for automatic message cleanup service (runs every 6 hours).

### Deployment
- **Backend**: Render.com
- **Mobile**: Expo app (Android/iOS via Expo Go)
- **Web**: Render.com or any static hosting service

## Message Backup & Restore System

### Architecture Overview
The message backup and restore system follows Zalo's dual-storage architecture:

1. **Database Storage (24 hours)**: Messages are stored in PostgreSQL database for 24 hours to enable real-time sync across devices and provide server-side message delivery.
2. **Local Storage (Permanent)**: Messages are simultaneously saved to AsyncStorage on the user's device and remain there permanently.
3. **Automatic Cleanup**: A cron job runs every 6 hours to delete messages older than 24 hours from the database.
4. **Google Drive Backup**: Users can backup all messages to their personal Google Drive and restore them when needed.

### How It Works

#### Message Flow
1. **Sending/Receiving Messages**:
   - When a user sends or receives a message, it's saved to both the database and local storage
   - ChatScreen uses MessageStorageService to handle dual storage automatically
   - Messages are organized by conversation (userId) in AsyncStorage

2. **Automatic Database Cleanup**:
   - Backend service runs every 6 hours (configured in backend/src/services/messageCleanupService.js)
   - Deletes all messages older than 24 hours from the database
   - Local storage on devices is not affected

3. **Backup to Google Drive**:
   - User navigates to Settings screen (via Profile → Settings icon)
   - Taps "Sao lưu tin nhắn" (Backup messages)
   - MessageStorageService exports all conversations from local storage
   - Backend uploads the backup file to user's Google Drive with timestamp
   - Backup metadata is saved locally to track last backup time

4. **Restore from Google Drive**:
   - User taps "Khôi phục tin nhắn" (Restore messages) in Settings
   - System fetches list of backup files from Google Drive
   - User confirms restoration (warns that current local messages will be replaced)
   - Backend downloads the backup file from Google Drive
   - MessageStorageService imports messages and rebuilds local storage
   - All conversations are restored with full message history

### Key Files

#### Mobile App
- `mobile/src/services/MessageStorageService.js`: Core service for local storage operations, backup export, and restore import
- `mobile/src/screens/ChatScreen.js`: Updated to save messages to both database and local storage
- `mobile/src/screens/SettingsScreen.js`: UI for backup/restore operations with storage statistics
- `mobile/src/api/api.js`: API client with messageBackupAPI endpoints

#### Backend
- `backend/src/services/googleDriveService.js`: Google Drive API integration using googleapis
- `backend/src/controllers/messageBackupController.js`: Handles backup/restore API endpoints
- `backend/src/services/messageCleanupService.js`: Cron job for automatic message deletion
- `backend/src/routes/messageBackupRoutes.js`: API routes for backup operations
- `backend/server.js`: Initializes cleanup service on startup

### Usage Instructions

1. **Accessing Settings**:
   - Open the app and go to your Profile
   - Tap the Settings icon (gear icon) in the top right
   - You'll see "Sao lưu & Khôi phục" section

2. **Creating a Backup**:
   - Tap "Sao lưu tin nhắn"
   - Confirm the backup operation
   - System uploads all messages to your Google Drive
   - You'll see confirmation when backup is complete

3. **Viewing Backup List**:
   - Tap "Danh sách backup" to see all your backups on Google Drive
   - Each backup shows filename and creation date

4. **Restoring Messages**:
   - Tap "Khôi phục tin nhắn"
   - System shows the latest backup file
   - Confirm restoration (WARNING: This replaces all current messages)
   - Messages are downloaded and imported to local storage
   - All conversations are restored

### Technical Notes

- **Storage Format**: Backup files are JSON format containing all conversations with messages
- **File Naming**: Backups are named `message-backup-YYYY-MM-DD-HH-mm-ss.json`
- **Google Drive Folder**: Backups are stored in app's folder in user's Google Drive
- **Cleanup Schedule**: Runs at server startup and then every 6 hours (0 */6 * * *)
- **Security**: Uses Replit's Google Drive connector for secure OAuth2 authentication
- **Local Metadata**: Tracks last backup/restore time in AsyncStorage under key `message_backup_metadata`

### Important Considerations

1. **24-Hour Window**: Messages are only available for real-time sync across devices for 24 hours
2. **Local Storage Size**: Large message histories may consume significant local storage
3. **Backup Frequency**: Users should backup regularly, especially before switching devices
4. **Restore Warning**: Restoring from backup completely replaces current local messages
5. **Internet Required**: Backup and restore operations require internet connection for Google Drive access