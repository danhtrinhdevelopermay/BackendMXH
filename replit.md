# Layedia - Social Media App

## Overview
Layedia is a full-stack social media application, similar to Facebook, designed for mobile platforms using React Native/Expo. Its backend is built with Node.js/Express and PostgreSQL. The application provides essential social networking functionalities such as posts, reactions, comments, friend connections, direct messaging, and real-time notifications. The vision for Layedia is to create a dynamic and engaging platform for users to connect and share, leveraging a modern tech stack for scalability and a rich user experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture (React Native + Expo)
The mobile application uses React Native with Expo SDK. Navigation is handled by React Navigation (Stack and Bottom Tab navigators), and UI components are built with React Native Paper following Material Design principles. State management primarily uses React Context API for global states like authentication and a custom AlertContext for a consistent alert system. Axios manages HTTP requests with JWT token injection. Secure storage for tokens is provided by Expo SecureStore, and media selection uses Expo Image Picker. Video playback is handled by Expo AV.

**Key Features & Implementations:**
- **Navigation:** Separate flows for authenticated and unauthenticated users, with a Bottom Tab Navigator for main authenticated sections (Home, Friends, Messages, Notifications, Profile). Modals are used for actions like creating posts, chatting, and editing profiles.
- **Custom Alert System:** A global, customizable alert system with various types (success, error, warning, info) and animated modal-based UI.
- **Voice Calling Signaling:** Socket.IO-based signaling layer for real-time call initiation and management, including UI for incoming/outgoing calls. (Note: Audio transmission via WebRTC is not implemented due to Expo Go limitations).
- **Video Playback:** Videos autoplay in feed with 50% visibility threshold, looping without controls. Tapping a video leads to a detail screen with full controls. Playback position is maintained when navigating between feed and detail views.
- **User Thoughts/Notes:** A "thoughts" bar in the Messages screen allows users to share short notes (max 100 characters) with optional emojis, visible to friends and updating in real-time.
- **Post Reactions:** Single-tap for 'like'/'unlike', long-press for a full reaction menu (6 types). Visual feedback indicates current reaction.
- **Message Reactions:** Long-press on any message to display a reaction menu with 6 emoji options (👍, ❤️, 😆, 😮, 😢, 😡). Reactions are displayed on messages and synced in real-time. Includes push notifications when someone reacts to your message.
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
- `/api/notifications`: Notification feed and status.
- `/api/thoughts`: User thoughts/notes management.
- `/api/upload`: Media upload.
- `/api/media/:id`: Media retrieval.
- `/api/avatar` & `/api/cover`: User avatar and cover photo management.

**Key Backend Features:**
- **Media Storage:** Cloudinary is used for cloud-based storage and delivery of images and videos, with URLs stored in the PostgreSQL database.
- **Privacy & Visibility:** Posts support `public` and `friends` privacy settings, with filtering applied across all relevant API endpoints.

## External Dependencies

### Database
- **PostgreSQL**: The primary relational database, hosted on Neon.
  - Schema includes tables for users, posts, comments, reactions, friendships, messages, message_reactions, notifications, user_thoughts, stories, and push_tokens.

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

### Deployment
- **Replit**: Current backend deployment.