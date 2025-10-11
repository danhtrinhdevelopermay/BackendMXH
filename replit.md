# Social Media App - React Native + Expo

## Overview

This is a full-stack social media application similar to Facebook, built with React Native/Expo for the mobile frontend and Node.js/Express with PostgreSQL for the backend API. The application provides core social networking features including posts, reactions, comments, friend connections, direct messaging, and real-time notifications.

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
- Modal screens: CreatePost, Chat, Comments accessed via Stack Navigator

**State Management Approach:**
- AuthContext provides centralized authentication state and methods
- Local component state for UI-specific data
- API calls trigger re-fetching to update views
- Polling intervals for real-time-like updates (messages every 3s, conversations every 5s)

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
- `/api/auth` - User registration, login, profile retrieval
- `/api/posts` - Post creation, news feed, user posts, deletion
- `/api/comments` - Comment management per post
- `/api/reactions` - Like/reaction system (6 types: like, love, haha, wow, sad, angry)
- `/api/friendships` - Friend requests, acceptance/rejection, search
- `/api/messages` - Direct messaging, conversations list
- `/api/notifications` - Notification feed, read status management
- `/api/upload` - Media upload (images/videos) stored directly in database
- `/api/media/:id` - Retrieve media from database by post ID

**Media Storage (Updated):**
- Media (images/videos) stored directly in database as BYTEA
- Posts table includes: `media_data` (bytea), `media_type` (varchar)
- Upload endpoint stores media in memory, then saves to database
- Media retrieval endpoint serves binary data with appropriate Content-Type
- Supports both images (JPEG, PNG) and videos (MP4) up to 50MB
- Mobile app uses expo-av for video playback

**Data Flow Pattern:**
- Media upload creates post with media_data, returns media ID
- CreatePost updates that post with content
- News feed returns post metadata with media_type (not media_data for efficiency)
- Frontend constructs media URL from post ID: /api/media/{post.id}
- Notification creation triggered automatically on social actions (comments, reactions, friend requests, messages)
- Conversations view shows latest message per unique user pair
- User reactions stored with ability to update reaction type

## External Dependencies

### Database
- **PostgreSQL** - Primary relational database (hosted on Neon)
- Direct pool connection using `pg` driver
- Schema includes: users, posts, comments, reactions, friendships, messages, notifications tables
- Database URL configured via environment variable `DATABASE_URL`

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
  
- **Deployment:**
  - Backend deployed on Render for stable production
  - Production URL: `https://backendmxh.onrender.com`
  - Backup Replit URL: `https://0ef1aeac-3e91-4d81-8d9d-c33937b51d90-00-znd0j4yczh4.pike.replit.dev`
  - Render deployment instructions: `DEPLOY_RENDER.md`
  - Media served directly from PostgreSQL database via API endpoint

### Key Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (defaults to placeholder if not set)
- `PORT` - Server port (defaults to 5000)