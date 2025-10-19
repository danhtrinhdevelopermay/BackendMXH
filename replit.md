# Layedia - Social Media App

## Overview
Layedia is a full-stack social media application, similar to Facebook, available on both mobile and web platforms. The mobile app is built with React Native/Expo, the web version uses Expo Web (React Native Web), and the backend is powered by Node.js/Express with PostgreSQL. The application provides essential social networking functionalities such as posts, reactions, comments, friend connections, direct messaging, and real-time notifications. The vision for Layedia is to create a dynamic and engaging platform for users to connect and share, leveraging a modern tech stack for scalability and a rich user experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture (React Native + Expo)
The mobile application uses React Native with Expo SDK. Navigation is handled by React Navigation (Stack and Bottom Tab navigators), and UI components are built with React Native Paper following Material Design principles. State management primarily uses React Context API for global states like authentication and a custom AlertContext for a consistent alert system. Axios manages HTTP requests with JWT token injection. Secure storage for tokens is provided by Expo SecureStore, and media selection uses Expo Image Picker. Video playback is handled by Expo AV.

**Key Features & Implementations:**
- **Navigation:** Separate flows for authenticated and unauthenticated users, with a Bottom Tab Navigator for main authenticated sections (Home, Friends, Messages, Notifications, Profile). Modals are used for actions like creating posts, chatting, and editing profiles.
- **Smooth Page Transitions:** Advanced animation system with multiple transition types:
  - **Slide transitions:** Horizontal slide-from-right for standard navigation (Profile, Search, Chat, etc.)
  - **Modal transitions:** Vertical slide-up animation for modal screens (CreatePost, PostDetail, Comments, VoiceCall, CreateStory, CreateThought) using forModalPresentationIOS with spring-based animation and swipe-to-dismiss gestures
  - **Fade transitions:** Smooth fade effects for MainTabs, ViewStory, and auth screens
  - **Tab animations:** Enhanced tab switching with scale, fade, and vertical slide effects
  - **Icon animations:** Tab bar icons feature spring-based scale and rotation animations on focus
  - All transitions use native driver for 60fps performance and smooth gestures
- **Interactive Posts:** Users can tap on post content (text or media) to open the full post detail view with a modal presentation. Videos automatically pause and preserve playback position when transitioning to the detail view.
- **Custom Alert System:** A global, customizable alert system with various types (success, error, warning, info) and animated modal-based UI.
- **Voice Calling Signaling:** Socket.IO-based signaling layer for real-time call initiation and management, including UI for incoming/outgoing calls. (Note: Audio transmission via WebRTC is not implemented due to Expo Go limitations).
- **Video Playback:** Videos autoplay in feed with 50% visibility threshold, looping without controls. Tapping a video leads to a detail screen with full controls. Playback position is maintained when navigating between feed and detail views.
- **User Thoughts/Notes:** A "thoughts" bar in the Messages screen allows users to share short notes (max 100 characters) with optional emojis, visible to friends and updating in real-time.
- **Post Reactions:** Single-tap for 'like'/'unlike', long-press for a full reaction menu (6 types). Visual feedback indicates current reaction.
- **Message Reactions:** Long-press on any message to display a reaction menu with 6 emoji options (👍, ❤️, 😆, 😮, 😢, 😡). Reactions are displayed on messages and synced in real-time. Includes push notifications when someone reacts to your message.
- **Messaging Streaks:** TikTok-style streak system that tracks consecutive days of mutual messaging between users. Features animated fire icon 🔥 with count display, shown next to usernames in the Messages screen. Streaks are automatically maintained when both users exchange messages within 24 hours. Milestone streaks (≥10 days) are displayed in a scrollable card view on the user's Profile screen with animated badges.
- **iOS-Style Gaussian Blur Modals:** All modals feature a Gaussian blur backdrop using `expo-blur` for an enhanced visual aesthetic.
- **Verified Badge:** Displays correctly for verified users across Friends list, requests, and search results.

### Backend Architecture (Node.js + Express)
The backend is a RESTful API built with Node.js and Express, following an MVC-like structure (Routes → Controllers → Database queries). It uses JWT for stateless authentication with bcrypt for password hashing and Express-validator for request validation.

**API Endpoints:**
- `/api/auth`: User authentication and profile management.
- `/api/users/:userId`: User information retrieval.
- `/api/posts`: Post creation, news feed, user posts, deletion.
- `/api/comments`: Comment management.
- `/api/reactions`: Post reaction system.
- `/api/friendships`: Friend request and management.
- `/api/messages`: Direct messaging.
- `/api/message-reactions`: Message reaction system (add, remove, get reactions).
- `/api/streaks/:userId`: Get streak with specific user.
- `/api/streaks`: Get all user's milestone streaks (for profile display).
- `/api/notifications`: Notification feed and status.
- `/api/thoughts`: User thoughts/notes management.
- `/api/upload`: Media upload.
- `/api/media/:id`: Media retrieval.
- `/api/avatar` & `/api/cover`: User avatar and cover photo management.
- `/health`: Health check endpoint for monitoring server status (returns status, timestamp, uptime).

**Key Backend Features:**
- **Media Storage:** Cloudinary is used for cloud-based storage and delivery of images and videos, with URLs stored in the PostgreSQL database.
- **Privacy & Visibility:** Posts support `public` and `friends` privacy settings, with filtering applied across all relevant API endpoints.
- **Anti-Spindown System (Backend):** Automatic keep-alive mechanism for Render.com deployment that pings `/health` endpoint every 14 minutes to prevent free-tier spindown. Activates automatically when `RENDER_EXTERNAL_URL` environment variable is detected. Can also ping the web app if `WEB_APP_URL` environment variable is set. Includes dedicated health check endpoint with server status and uptime information.
- **Dual Database System:** The backend supports both primary and secondary PostgreSQL databases for redundancy and high availability:
  - **Write Operations (INSERT, UPDATE, DELETE):** Data is written to the primary database first. If the primary database fails or is unavailable, writes automatically fail over to the secondary database. No duplicate writes occur.
  - **Read Operations (SELECT):** All read queries fetch data from BOTH databases simultaneously and merge the results, ensuring complete data visibility regardless of which database holds the data.
  - **Configuration:** Uses `DATABASE_URL` (primary) and `DATABASE_URL_SECONDARY` (secondary) environment variables.
  - **DualDatabasePool class:** Manages connections with three key methods:
    - `query()`: For write operations with automatic failover
    - `queryBoth()`: Returns separate results from both databases
    - `queryAll()`: Merges results from both databases (used for all read operations)
  - **Data Integrity:** Prevents duplicates by using unique ID detection when merging results
  - **Automatic Sorting:** Merged results are automatically sorted by `created_at` or `updated_at` timestamps

## External Dependencies

### Database
- **PostgreSQL**: The primary relational database, hosted on Neon.
  - Schema includes tables for users, posts, comments, reactions, friendships, messages, message_reactions, message_streaks, notifications, user_thoughts, stories, and push_tokens.

### Third-Party Services & APIs
- **Expo Services**:
  - Expo SecureStore
  - Expo Image Picker
  - Expo AV
  - Expo Constants
- **Backend Services**:
  - **Multer**: File upload middleware.
  - **JWT (jsonwebtoken)**: For token generation and verification.
  - **Bcrypt**: For password hashing.
  - **Cloudinary**: Cloud-based media storage and delivery for images and videos.
  - **Axios**: HTTP client for keep-alive pings in Anti-Spindown system.

### Deployment
- **Backend**: Deployed on Render.com (https://backendmxh-1.onrender.com)
- **Mobile**: Expo app (Android/iOS via Expo Go)
- **Web**: Can be deployed to Render.com or any static hosting service

## Web Platform Architecture

### Web Application (web/)
A separate web version created from the mobile codebase, optimized for browser deployment. Built with Expo Web using Metro bundler and React Native Web.

**Directory Structure:**
```
web/
├── src/              # Shared source code from mobile
│   ├── api/          # API calls with web-compatible storage
│   ├── components/   # React components
│   ├── context/      # React Context (Auth, Alert)
│   ├── hooks/        # Custom hooks
│   ├── navigation/   # React Navigation
│   ├── screens/      # App screens
│   ├── services/     # Socket.IO, web-safe notifications
│   └── utils/        # Storage wrapper (localStorage for web)
├── assets/           # Images, icons
├── dist/             # Built static files for deployment
├── App.js            # Root component
├── app.json          # Expo configuration
├── package.json      # Dependencies
├── render.yaml       # Render deployment config
└── DEPLOY_RENDER.md  # Deployment guide
```

**Web-Specific Adaptations:**
- **Storage**: Uses `localStorage` instead of `expo-secure-store` via a platform-aware wrapper (`src/utils/storage.js`)
- **Notifications**: Push notifications disabled on web (mobile-only feature)
- **Build System**: Metro bundler with `expo export --platform web` command
- **Deployment**: Static files served via `serve` package on port 5000
- **Anti-Spindown System (Web)**: Automatic keep-alive mechanism in `App.js` that pings itself every 14 minutes when deployed on Render.com. Activates only when hostname includes 'onrender.com'. Uses browser's `fetch` API with HEAD method to minimize bandwidth usage.

**Key Features on Web:**
- ✅ User authentication and profiles
- ✅ News feed with posts, reactions, comments
- ✅ Stories
- ✅ Friend management and search
- ✅ Image/video upload (max 5MB per file)
- ❌ Messaging/Chat (not available on web)
- ❌ Voice calls (not available on web)
- ❌ Push notifications (not supported on web)

**Commands:**
- Development: `npm start` (runs Expo dev server)
- Build: `npx expo export --platform web` (generates dist/)
- Serve: `npx serve dist -l 5000` (serves static files)

**Deployment to Render:**
See `web/DEPLOY_RENDER.md` for detailed deployment instructions.