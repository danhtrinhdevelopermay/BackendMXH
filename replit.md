# Layedia - Social Media App

## Overview
Layedia is a full-stack social media application, similar to Facebook, for mobile and web. It offers core social networking features like posts, reactions, comments, friends, direct messaging, and real-time notifications. The project aims to create an engaging platform for connection and sharing, using a modern tech stack for scalability and a rich user experience.

## User Preferences
- Preferred communication style: Simple, everyday language.
- Code preference: Only write/fix code, no code evaluation or comments.
- Work style: Quick execution to save time.

## System Architecture

### UI/UX Decisions
The application prioritizes a fluid user experience with smooth page transitions (slide, modal, fade, tab, icon animations) at 60fps. Interactive posts allow tapping to view full details, with video playback controls. A custom, animated, modal-based alert system provides various notifications (success, error, warning, info). Modals feature iOS-style Gaussian blur backdrops. Verified users display a badge. Media (images and videos) are displayed with their original aspect ratio using stored dimensions. A notification bell with an unread count badge (auto-refreshing every 30 seconds) is present in the header. A professional image editor allows users to edit photos after capture with filters, adjustments, and rotation before posting.

### Frontend Architecture (React Native + Expo)
The mobile app uses React Native with Expo SDK. Navigation is managed by React Navigation (Stack and Bottom Tab navigators), and UI components are built with React Native Paper. State management uses React Context API. Axios handles HTTP requests, Expo SecureStore manages secure token storage, and Expo Image Picker and Expo AV handle media. Key features include: authenticated/unauthenticated navigation flows, video playback (autoplay in feed, full controls on detail), short user thoughts/notes in messages, post reactions (single-tap like/unlike, long-press for menu), message reactions (long-press for emoji menu with push notifications), TikTok-style messaging streaks, WebRTC-powered real-time voice calls with mute/speaker controls, automatic OTA APK updates with progress tracking, a dual-storage message system (Zalo-style) with Google Drive backup/restore, a TikTok-style beauty camera with 8 filters and adjustable sliders, a professional image editor, and a Gemini AI-powered content writer for improving or generating text in posts.

### Backend Architecture (Node.js + Express)
The backend is a RESTful API built with Node.js and Express, following an MVC-like structure. It uses JWT for stateless authentication with bcrypt for password hashing and Express-validator for request validation. Key features include: OTP-based password reset system with Resend email service (supports test mode and production mode with custom domains), Cloudinary for media storage (capturing dimensions for aspect ratio), post privacy settings (`public`, `friends`), an anti-spindown system for Render.com, a dual PostgreSQL database system for redundancy (writes to primary, reads merge from both), an auto-reaction system with 100 fake Vietnamese accounts for gradual post reactions, a Socket.IO server for WebRTC signaling, an admin interface for APK version management (uploading new versions, force updates), a cron job for message cleanup (deleting messages older than 24 hours from the database), Google Drive integration for message backup/restore, and Gemini AI integration (`/api/ai/generate-text`) for improving or generating Vietnamese content.

### Web Platform Architecture
A separate web version is created from the mobile codebase using Expo Web (React Native Web). It uses `localStorage` instead of `expo-secure-store`, and push notifications are disabled. Key web features include user authentication, profiles, news feed, stories, and friend management, and image/video upload. Messaging, voice calls, and push notifications are not available on the web.

## External Dependencies

### Database
- **PostgreSQL**: Primary relational database, hosted on Neon, for users, posts (with media dimensions), comments, reactions, friendships, messages, message_reactions, message_streaks, notifications, user_thoughts, stories, push_tokens, and app_versions.
- **Fake Accounts**: 100 Vietnamese fake user accounts for the auto-reaction system.

### Third-Party Services & APIs
- **Expo Services**: SecureStore, Image Picker, AV, Constants, FileSystem (for APK downloads), IntentLauncher (for APK installation), AsyncStorage (for local message storage), Camera (for beauty camera), GL (for filter effects), Image Manipulator (for applying beauty filters).
- **Resend**: Email delivery service for OTP verification codes and password change notifications. Supports test mode (limited to authorized addresses) and production mode (verified custom domain required). API key stored in Replit Secrets.
- **Cloudinary**: Cloud-based media storage and delivery.
- **Multer**: File upload middleware.
- **JWT (jsonwebtoken)**: Token generation and verification.
- **Bcrypt**: Password hashing.
- **Axios**: HTTP client (for keep-alive pings).
- **Google Gemini AI**: AI-powered content generation using Gemini 2.0 Flash model via `@google/genai`.
- **WebRTC**: Real-time peer-to-peer audio communication using `react-native-webrtc` and `react-native-incall-manager`. Uses Google STUN servers.
- **Google APIs (googleapis)**: Google Drive API v3 for message backup/restore.
- **Node-cron**: Scheduled task runner for automatic message cleanup and database archiving.
- **React Native Community Slider**: Slider component for beauty filter intensity.

### Deployment
- **Backend**: Render.com
- **Mobile**: Expo app (Android/iOS via Expo Go)
- **Web**: Render.com or static hosting.