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
- Expo Image Picker for media selection

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
- `/api/upload` - Image upload with multer (disk storage)

**Data Flow Pattern:**
- Notification creation triggered automatically on social actions (comments, reactions, friend requests, messages)
- News feed aggregates posts from user and accepted friends
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
  - Expo Image Picker - Native image selection
  - Expo Constants - Configuration access
  
- **Backend Services:**
  - Multer - File upload middleware (disk storage in `/uploads` directory)
  - JWT (jsonwebtoken) - Token generation and verification
  - Bcrypt - Password hashing
  
- **Deployment:**
  - Backend deployed on Replit infrastructure
  - API URL: `https://b0f4cf19-856b-4c85-94aa-7e706915c721-00-1ot8heuucu3xd.pike.replit.dev`
  - Static file serving for uploaded images via Express static middleware

### Key Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (defaults to placeholder if not set)
- `PORT` - Server port (defaults to 5000)