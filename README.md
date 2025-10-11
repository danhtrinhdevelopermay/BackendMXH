# Social Media App - React Native + Expo

Ứng dụng mạng xã hội Android giống Facebook được xây dựng với React Native, Expo, Node.js/Express và PostgreSQL.

## 🚀 Tính năng

### Backend API (Node.js + Express + PostgreSQL)
- ✅ Authentication (Đăng ký/Đăng nhập) với JWT
- ✅ Đăng bài viết (text và hình ảnh)
- ✅ News Feed cá nhân hóa từ bạn bè
- ✅ Reactions (like, love, haha, wow, sad, angry)
- ✅ Bình luận bài viết
- ✅ Hệ thống kết bạn (gửi/chấp nhận/từ chối lời mời)
- ✅ Nhắn tin trực tiếp 1-1
- ✅ Thông báo (friend requests, comments, reactions, messages)
- ✅ Upload hình ảnh
- ✅ Tìm kiếm người dùng

### Mobile App (React Native + Expo)
- ✅ Bottom Tab Navigation
- ✅ Màn hình Login/Register
- ✅ Home/News Feed
- ✅ Tạo bài viết với Image Picker
- ✅ Profile với danh sách bài viết
- ✅ Friends (danh sách bạn bè, friend requests, tìm kiếm)
- ✅ Messages (danh sách cuộc trò chuyện, chat interface)
- ✅ Notifications
- ✅ Comments screen

## 📋 Yêu cầu hệ thống

- Node.js 18+ 
- npm hoặc yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app trên điện thoại Android (tải từ Play Store)
- Hoặc Android Studio/Xcode để chạy emulator

## 🛠️ Backend API

Backend đã được deploy và đang chạy trên Replit:
- **API URL**: https://a8bd23f7-87d2-4aa4-8e60-6425fe004656-00-33auajo5tz84q.kirk.replit.dev
- **Database**: PostgreSQL (Neon)

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin profile (cần token)

#### Posts
- `POST /api/posts` - Tạo bài viết mới
- `GET /api/posts/feed` - Lấy news feed
- `GET /api/posts/user/:userId` - Lấy bài viết của user
- `DELETE /api/posts/:postId` - Xóa bài viết

#### Comments
- `POST /api/comments/:postId` - Thêm comment
- `GET /api/comments/:postId` - Lấy danh sách comments
- `DELETE /api/comments/:commentId` - Xóa comment

#### Reactions
- `POST /api/reactions/:postId` - Thêm/cập nhật reaction
- `DELETE /api/reactions/:postId` - Xóa reaction
- `GET /api/reactions/:postId` - Lấy danh sách reactions

#### Friendships
- `POST /api/friendships/request` - Gửi lời mời kết bạn
- `PUT /api/friendships/request/:requestId` - Chấp nhận/từ chối lời mời
- `GET /api/friendships/friends` - Lấy danh sách bạn bè
- `GET /api/friendships/requests` - Lấy danh sách lời mời kết bạn
- `GET /api/friendships/search?query=...` - Tìm kiếm người dùng

#### Messages
- `POST /api/messages` - Gửi tin nhắn
- `GET /api/messages/conversations` - Lấy danh sách cuộc trò chuyện
- `GET /api/messages/:userId` - Lấy tin nhắn với user

#### Notifications
- `GET /api/notifications` - Lấy danh sách thông báo
- `PUT /api/notifications/:notificationId/read` - Đánh dấu đã đọc
- `PUT /api/notifications/read-all` - Đánh dấu tất cả đã đọc

#### Upload
- `POST /api/upload` - Upload hình ảnh (multipart/form-data)

## 📱 Cài đặt Mobile App

### Bước 1: Download code về máy
```bash
# Clone hoặc download code từ Replit
# Hoặc copy folder 'mobile' về máy của bạn
```

### Bước 2: Cài đặt dependencies
```bash
cd mobile
npm install
```

### Bước 3: Chạy app với Expo
```bash
# Start Expo development server
npm start

# Hoặc
expo start
```

### Bước 4: Test app

#### Option 1: Sử dụng Expo Go (Khuyến nghị cho testing)
1. Tải app **Expo Go** từ Play Store
2. Quét QR code từ terminal/browser
3. App sẽ mở trong Expo Go

#### Option 2: Sử dụng Android Emulator
```bash
npm run android
```

#### Option 3: Sử dụng iOS Simulator (chỉ trên Mac)
```bash
npm run ios
```

## 📦 Build APK

### Sử dụng EAS Build (Khuyến nghị)

1. **Cài đặt EAS CLI**
```bash
npm install -g eas-cli
```

2. **Login vào Expo**
```bash
eas login
```

3. **Configure EAS**
```bash
eas build:configure
```

4. **Build APK cho Android**
```bash
# Build APK (local install)
eas build -p android --profile preview

# Hoặc build AAB (Google Play Store)
eas build -p android --profile production
```

5. **Download APK**
- Sau khi build xong, EAS sẽ cung cấp link download APK
- Tải APK về và cài đặt trên điện thoại Android

### Build local (không cần EAS)
```bash
# Build APK local
expo build:android -t apk
```

## 🔧 Cấu hình

### API URL
File `mobile/app.json` đã được cấu hình với backend URL:
```json
"extra": {
  "apiUrl": "https://a8bd23f7-87d2-4aa4-8e60-6425fe004656-00-33auajo5tz84q.kirk.replit.dev"
}
```

Nếu backend URL thay đổi, cập nhật giá trị này.

## 📝 Database Schema

### Tables
- **users** - Thông tin người dùng (username, email, password_hash, full_name, avatar_url, bio)
- **posts** - Bài viết (user_id, content, image_url)
- **comments** - Bình luận (post_id, user_id, content)
- **reactions** - Reactions (post_id, user_id, reaction_type)
- **friendships** - Quan hệ bạn bè (requester_id, addressee_id, status)
- **messages** - Tin nhắn (sender_id, receiver_id, content, is_read)
- **notifications** - Thông báo (user_id, type, content, related_user_id, related_post_id, is_read)

## 🎨 Tech Stack

### Backend
- Node.js + Express.js
- PostgreSQL (Neon database)
- JWT Authentication
- Multer (file upload)
- bcrypt (password hashing)

### Mobile
- React Native
- Expo SDK 51
- React Navigation (Stack + Bottom Tabs)
- React Native Paper (UI components)
- Axios (API calls)
- Expo Image Picker
- Expo Secure Store (token storage)

## 🐛 Troubleshooting

### Lỗi kết nối API
- Kiểm tra backend server đang chạy
- Verify API URL trong `app.json`
- Kiểm tra network connection

### Lỗi build APK
- Đảm bảo đã cài đặt EAS CLI
- Login vào Expo account
- Kiểm tra app.json cấu hình đúng

### Lỗi dependencies
```bash
# Xóa node_modules và cài lại
rm -rf node_modules
npm install
```

## 📚 Tài liệu tham khảo

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [EAS Build](https://docs.expo.dev/build/introduction/)

## 🚀 Các bước tiếp theo

1. **Real-time features**: Tích hợp WebSocket/Socket.io cho messaging và notifications real-time
2. **Cloud Storage**: Upload ảnh lên Cloudinary hoặc AWS S3
3. **Push Notifications**: Sử dụng Expo Notifications
4. **Video support**: Thêm tính năng upload và phát video
5. **Stories**: Tính năng story tự động xóa sau 24h
6. **Groups**: Tạo và quản lý nhóm
7. **Advanced Feed Algorithm**: Thuật toán ranking posts dựa trên engagement

## 📄 License

MIT

## 👨‍💻 Author

Được xây dựng với ❤️ bằng React Native + Expo
