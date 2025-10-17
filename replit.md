# Layedia - Social Media App (React Native + Expo)

## Overview

Layedia is a full-stack social media application similar to Facebook, built with React Native/Expo for the mobile frontend and Node.js/Express with PostgreSQL for the backend API. The application provides core social networking features including posts, reactions, comments, friend connections, direct messaging, and real-time notifications.

## App Branding

- **App Name:** Layedia
- **Logo:** Custom gradient checkmark logo with blue-purple gradient (located at `mobile/assets/logo.png`)
- **App Icon:** Logo used as launcher icon for APK builds (`mobile/assets/icon.png`, `mobile/assets/adaptive-icon.png`)
- **Branding Colors:** Blue-purple gradient theme (#667eea to #764ba2)
- **Logo Display:** Login screen shows logo image (120x120) with app name "Layedia" below
- **Adaptive Icon Background:** Gradient blue (#667eea) matches logo theme

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture (React Native + Expo)

**Mobile Application Stack:**
- React Native with Expo SDK for cross-platform mobile development
- React Navigation for screen navigation (Stack and Bottom Tab navigators)
- React Native Paper for Material Design UI components
- Context API for global state management (authentication)
- Axios for HTTP requests with interceptor-based JWT token injection
- Expo SecureStore for secure token storage
- Expo Image Picker for media selection (images and videos)
- Expo AV for video playback in posts

**Navigation Structure:**
- Unauthenticated flow: Login/Register screens via Stack Navigator
- Authenticated flow: Bottom Tab Navigator with 5 main tabs (Home, Friends, Messages, Notifications, Profile)
- Modal screens: CreatePost, Chat, Comments, EditProfile, PostDetail accessed via Stack Navigator
- User Profile: Clicking on a user in search results opens their profile with posts, friendship status, and action buttons (add friend/message)
- Profile Editing: Users can edit their full name, bio, avatar, and cover photo via EditProfileScreen
- Post Detail: PostDetailScreen displays individual posts with full video controls when tapped from feed

**State Management Approach:**
- AuthContext provides centralized authentication state and methods
- AlertContext provides custom alert/dialog system with modern UI (success, error, warning, info types)
- Local component state for UI-specific data
- API calls trigger re-fetching to update views
- Polling intervals for real-time-like updates (messages every 3s, conversations every 5s)

**Custom Alert System:**
- Custom alert component replaces native Alert.alert() across all screens
- AlertContext + AlertProvider manage alert state globally
- CustomAlert component with beautiful UI: Modal-based, animated, with type-specific icons
- Alert types: 'success' (green checkmark), 'error' (red X), 'warning' (orange), 'info' (blue info icon)
- Supports single and multi-button configurations with cancel/destructive styles
- Smooth spring animations on show/hide
- Used consistently across Login, Register, Home, Profile, Friends, Messages, Notifications, Comments, CreatePost screens

**Voice Calling Infrastructure (Signaling Layer - Oct 2025):**
- Socket.IO-based real-time signaling for call initiation and management
- VoiceCallScreen component handles call UI (outgoing/incoming states, timer, mute/speaker controls)
- IncomingCallModal displays incoming call notifications with accept/reject actions
- useIncomingCall hook manages global incoming call state and navigation
- SocketService provides centralized socket connection management (idempotent, single shared instance)
- Call flow: User clicks call button → Socket emits call_user → Receiver sees IncomingCallModal → Accept/Reject
- Socket events: call_user, incoming_call, accept_call, reject_call, call_ended, call_accepted, call_rejected
- **Important Limitation:** Current implementation provides UI and signaling only - no actual audio transmission
  - WebRTC is NOT implemented (react-native-webrtc requires custom development build, incompatible with Expo Go)
  - For production voice calling, consider third-party solutions (Agora, Twilio, Daily.co) or custom development build with react-native-webrtc
- Performance optimizations: React.memo, useMemo, useCallback prevent unnecessary re-renders
- Proper cleanup: Timer intervals cleared on unmount, socket listeners properly managed

**Video Playback Features (Oct 2025):**
- Feed videos autoplay when scrolled into view (50% visibility threshold)
- Videos in feed display without controls and loop continuously
- Tapping a video navigates to PostDetailScreen with full controls
- PostDetailScreen displays videos with native controls, autoplay, and looping
- Viewability tracking using FlatList callbacks for optimal performance
- Video refs managed for potential future play/pause control
- **Video Playback Continuity (Oct 12, 2025):** Videos remember playback position when navigating from feed to post detail
  - HomeScreen captures video position (positionMillis) before navigation
  - Position passed to PostDetailScreen via navigation params
  - PostDetailScreen resumes video from saved position using setPositionAsync on video load
  - Provides seamless viewing experience across screen transitions

**User Thoughts/Notes Sharing Feature (Oct 12, 2025):**
- Messenger-like thoughts/notes feature displayed at the top of MessagesScreen
- ThoughtsBar component: Horizontal scrollable list of user thoughts with avatars
- Users can create/update/delete their own thought (max 100 characters)
- Optional emoji selection (10 options: 😊, 😂, ❤️, 🎉, 🔥, 👍, 🤔, 😎, 🌟, 💪)
- Thoughts displayed as bubbles above user avatars
- Shows current user's thought first, followed by friends' thoughts
- CreateThoughtModal: Full-featured modal for thought creation/editing with emoji picker
- Real-time updates: Thoughts refresh every 5 seconds along with conversations
- User guard: Component safely handles AuthContext initialization to prevent crashes
- Visual design: Blue gradient "+" button for creating, bordered bubbles for displaying thoughts

**Post Reactions - Like/Unlike Toggle (Oct 14, 2025):**
- Simple like/unlike toggle functionality on posts in HomeScreen and PostDetailScreen
- Single tap behavior: If not liked → likes the post; If already liked → unlikes (removes reaction)
- If user has a different reaction type, single tap changes it to 'like'
- Long press opens full reaction menu with 6 options (like, love, haha, wow, sad, angry)
- Visual feedback: Button shows current reaction icon and colored highlight when user has reacted
- Server-side updates with automatic UI refresh after each reaction change
- Consistent behavior across all post viewing contexts (feed, post detail)

**iOS-Style Gaussian Blur Modals (Oct 14, 2025):**
- All modals enhanced with Gaussian blur backdrop effect using expo-blur
- Modal components with blur effect:
  - ReactionsModal: Blur intensity 90, dark tint for reactions list overlay
  - CreateThoughtModal: Blur intensity 80, dark tint for thought creation dialog
  - CustomAlert: Blur intensity 90, dark tint for alert dialogs
  - IncomingCallModal: Blur intensity 100, dark tint with gradient overlay for incoming calls
- iOS-like visual aesthetic with smooth, translucent backgrounds
- Maintains existing animations and interactions while adding depth perception
- Better visual hierarchy separating modal content from background
- Consistent user experience across all modal interactions

**Verified Badge on Friends Screen (Oct 14, 2025):**
- Fixed bug: Verified badges now display correctly on Friends screen
- VerifiedBadge component added to all three sections: Friends list, Friend requests, Search results
- Backend already returns is_verified status from friendships endpoints (getFriends, getFriendRequests, searchUsers)
- Blue checkmark icon displays next to verified users' names with consistent 16px size
- Clicking badge shows popup explaining verification status

### Backend Architecture (Node.js + Express)

**API Design Pattern:**
- RESTful API architecture with resource-based endpoints
- MVC-like structure: Routes → Controllers → Database queries
- Middleware-based authentication using JWT tokens
- Express-validator for request validation
- CORS enabled for cross-origin requests

**Authentication & Authorization:**
- JWT-based stateless authentication with Bearer token scheme
- Password hashing using bcrypt (salt rounds: 10)
- Token verification middleware applied to protected routes
- 7-day token expiration period

**Route Organization:**
- `/api/auth` - User registration, login, profile retrieval, profile update (PUT /auth/profile)
- `/api/users/:userId` - Get user information by ID with friendship status
- `/api/posts` - Post creation, news feed, user posts, deletion
- `/api/comments` - Comment management per post
- `/api/reactions` - Like/reaction system (6 types: like, love, haha, wow, sad, angry)
- `/api/friendships` - Friend requests, acceptance/rejection, search
- `/api/messages` - Direct messaging, conversations list
- `/api/notifications` - Notification feed, read status management
- `/api/thoughts` - User thoughts/notes (create/update, get all, get by user, delete)
- `/api/upload` - Media upload (images/videos) stored directly in database
- `/api/media/:id` - Retrieve media from database by post ID
- `/api/avatar` - Upload/retrieve user avatar (POST with image, GET /api/avatar/:userId)
- `/api/cover` - Upload/retrieve user cover photo (POST with image, GET /api/cover/:userId)

**Media Storage (Cloudinary Integration - Updated Oct 2025):**
- Media (images/videos) uploaded to Cloudinary cloud storage
- Posts table includes: `media_url` (text), `media_type` (varchar) 
- Users table includes: `avatar_url` (text), `cover_url` (text)
- Upload endpoint uses Cloudinary SDK to upload files, stores returned URLs in database
- Cloudinary handles image/video optimization, transformations, and CDN delivery
- Supports both images (JPEG, PNG) and videos (MP4) up to 50MB
- Mobile app displays media directly from Cloudinary URLs
- Avatar and cover photos uploaded separately to Cloudinary via dedicated endpoints
- Legacy database columns (media_data, avatar_data, cover_data) retained for backward compatibility

**Privacy & Visibility:**
- Posts support privacy settings: `public` (visible to everyone) or `friends` (visible only to friends)
- Privacy filtering applied across all endpoints:
  - News feed: Shows own posts, public posts, and friends-only posts from accepted friends
  - User profile: Shows all posts if viewing own profile; applies privacy filter for others
  - Search: Respects privacy settings, only returns posts user is authorized to view
- Privacy validation on post creation prevents invalid values
- Default privacy is 'public' for backward compatibility

**Data Flow Pattern:**
- Media upload sends file to Cloudinary, creates post with media_url, returns Cloudinary URL and post ID
- CreatePost updates that post with content and privacy setting
- News feed returns post metadata with media_url, media_type and privacy
- Frontend displays media directly from Cloudinary URL (fallback to /api/media/{post.id} for legacy posts)
- Notification creation triggered automatically on social actions (comments, reactions, friend requests, messages)
- Conversations view shows latest message per unique user pair
- User reactions stored with ability to update reaction type
- User profile view returns user info with friendship status (friends, request_sent, request_received, or null)
- ProfileScreen handles both own profile (edit/logout) and other users' profiles (add friend/message buttons with state-aware UI)
- Profile editing: Users update full_name, bio via PUT /auth/profile; Avatar/cover uploaded separately then displayed via /api/avatar/:userId and /api/cover/:userId
- Avatar and cover images load with cache-busting query params to show latest updates immediately

## External Dependencies

### Database
- **PostgreSQL** - Primary relational database (hosted on Neon)
- Direct pool connection using `pg` driver
- Schema includes: users, posts, comments, reactions, friendships, messages, notifications, user_thoughts, stories, push_tokens tables
- Database URL configured via environment variable `DATABASE_URL`
- **user_thoughts table:** Stores user thoughts/notes with unique constraint per user, includes content (max 100 chars), emoji, and timestamps
- **stories table:** Stores 24-hour stories with automatic expiration (expires_at timestamp)
- **push_tokens table:** Stores device push notification tokens for real-time notifications
- **📋 Complete Database Schema Documentation:** See `DATABASE_SCHEMA.md` for full schema details, migration guide, and setup instructions

### Third-Party Services & APIs
- **Expo Services:**
  - Expo SecureStore - Encrypted credential storage
  - Expo Image Picker - Media selection (images/videos, max 60s for video)
  - Expo AV - Video playback with native controls
  - Expo Constants - Configuration access
  
- **Backend Services:**
  - Multer - File upload middleware (memory storage, 50MB limit)
  - JWT (jsonwebtoken) - Token generation and verification
  - Bcrypt - Password hashing
  - Cloudinary - Cloud-based media storage and delivery (images & videos)
  
- **Deployment:**
  - Backend currently using Replit URL: `https://25381eed-bb44-406f-9912-690d32f22c41-00-3gr8xaickanud.pike.replit.dev`
  - Alternative Render URL (not active): `https://backendmxh.onrender.com`
  - Render deployment instructions: `DEPLOY_RENDER.md`
  - Media served directly from PostgreSQL database via API endpoint

### Key Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (defaults to placeholder if not set)
- `PORT` - Server port (defaults to 5000)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary account cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret