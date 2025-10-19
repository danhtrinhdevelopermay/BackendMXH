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
- **Dynamic Theme System**: Server-driven theme configuration that automatically changes app appearance based on special events (e.g., October 20th Women's Day) without requiring app updates. Theme is fetched from backend API, cached locally (AsyncStorage for mobile, localStorage for web), and refreshed every 30 minutes. Special event themes include custom colors (pink palette for Women's Day), event banners, and greeting messages.

### Frontend Architecture (React Native + Expo)
The mobile application uses React Native with Expo SDK. Navigation is handled by React Navigation (Stack and Bottom Tab navigators), and UI components are built with React Native Paper. State management primarily uses React Context API (AuthContext, AlertContext, ThemeContext). Axios manages HTTP requests, Expo SecureStore provides secure token storage, and Expo Image Picker and Expo AV handle media.
- **Key Features**: Navigation flows (authenticated/unauthenticated), video playback (autoplay in feed, full controls on detail), user thoughts/notes (short notes with emojis in Messages screen), post reactions (single-tap like/unlike, long-press for menu), message reactions (long-press for emoji menu with push notifications), messaging streaks (TikTok-style mutual messaging streak system with animated fire icon and milestone badges), **real-time voice calls** (WebRTC-powered audio calls with mute/speaker controls, using STUN servers for peer-to-peer connectivity), **dynamic theming** (server-driven theme system with offline caching).

### Backend Architecture (Node.js + Express)
The backend is a RESTful API built with Node.js and Express, following an MVC-like structure. It uses JWT for stateless authentication with bcrypt for password hashing and Express-validator for request validation.
- **Key Features**:
  - **Media Storage**: Cloudinary for cloud-based storage of images and videos. Media dimensions (width/height) are captured from Cloudinary on upload and stored in database for aspect ratio calculations.
  - **Privacy & Visibility**: Posts support `public` and `friends` privacy settings.
  - **Anti-Spindown System**: Automatic keep-alive mechanism for Render.com deployment.
  - **Dual Database System**: Supports primary and secondary PostgreSQL databases for redundancy. Writes go to primary with failover to secondary. Reads query both databases and merge results, ensuring data consistency and availability.
  - **Auto-Reaction System**: Automated service that adds gradual, natural reactions from 100 fake Vietnamese accounts to new posts. Reactions are distributed realistically (Like 40%, Love 30%, Haha 15%, Wow 10%, Sad 5%) with timing between 5 seconds to 3 minutes. Service runs in background and checks for new posts every 10 seconds.
  - **WebRTC Signaling**: Socket.IO server handles WebRTC signaling for voice calls, relaying SDP offers/answers and ICE candidates between call participants.
  - **Dynamic Theme API**: RESTful endpoint (`/api/theme/config`) that returns theme configuration based on current date. Automatically switches to special event themes (e.g., pink color scheme for October 20th Women's Day) without requiring app updates. Includes fallback to default theme and supports multiple special events throughout the year.

### Web Platform Architecture
A separate web version is created from the mobile codebase using Expo Web (React Native Web).
- **Web-Specific Adaptations**: Uses `localStorage` instead of `expo-secure-store`, push notifications are disabled.
- **Key Features on Web**: User authentication, profiles, news feed, stories, friend management, image/video upload. Messaging, voice calls, and push notifications are not available on the web.

## External Dependencies

### Database
- **PostgreSQL**: Primary relational database, hosted on Neon. Schema includes tables for users, posts (with media_width/media_height columns for aspect ratio), comments, reactions, friendships, messages, message_reactions, message_streaks, notifications, user_thoughts, stories, and push_tokens.
- **Fake Accounts**: 100 Vietnamese fake user accounts (emails: @fake.com, password: FakeUser123) for auto-reaction system. These accounts don't trigger notifications.

### Third-Party Services & APIs
- **Expo Services**: SecureStore, Image Picker, AV, Constants.
- **Cloudinary**: Cloud-based media storage and delivery.
- **Multer**: File upload middleware (backend).
- **JWT (jsonwebtoken)**: Token generation and verification (backend).
- **Bcrypt**: Password hashing (backend).
- **Axios**: HTTP client for keep-alive pings (backend).
- **WebRTC**: Real-time peer-to-peer audio communication using `react-native-webrtc` for media streams and RTCPeerConnection, with `react-native-incall-manager` for audio routing (earpiece/speaker control). Uses Google STUN servers for NAT traversal.

### Deployment
- **Backend**: Render.com
- **Mobile**: Expo app (Android/iOS via Expo Go)
- **Web**: Render.com or any static hosting service