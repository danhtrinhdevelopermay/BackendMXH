# Hướng Dẫn Cài Đặt và Test OneSignal Push Notifications

## 📱 Tích hợp đã hoàn thành

Hệ thống push notifications OneSignal đã được tích hợp vào ứng dụng Android với các tính năng:

### ✅ Chức năng đã hoàn thành:

1. **Tự động gửi thông báo khi:**
   - Có tin nhắn mới
   - Có người thả reaction (like, love, haha, wow, sad, angry) vào bài viết
   - Có lời mời kết bạn
   - Lời mời kết bạn được chấp nhận
   - Có comment mới (nếu có)

2. **Tính năng OneSignal:**
   - Tự động đăng ký device khi user đăng nhập
   - Xóa device khi user đăng xuất
   - Hỗ trợ navigation tới các màn hình tương ứng khi tap vào notification
   - Hiển thị notification ngay cả khi app đang mở (foreground)

---

## 🚀 Hướng Dẫn Build APK với OneSignal

### Bước 1: Cấu hình OneSignal Dashboard

1. Truy cập: https://onesignal.com
2. Đăng nhập và vào App của bạn
3. Vào **Settings** → **Platforms** → **Google Android (FCM)**
4. Cấu hình Firebase Cloud Messaging:
   - Tải Firebase config file (`google-services.json`)
   - Upload Server Key từ Firebase Console

### Bước 2: Thêm Google Services vào Android

1. Tải `google-services.json` từ Firebase Console
2. Đặt file vào: `mobile/android/app/google-services.json`

### Bước 3: Build APK

```bash
cd mobile

# Build APK (Development)
eas build --profile development --platform android

# Hoặc build APK Production
eas build --profile production --platform android
```

**Lưu ý:** File `app.json` đã được cấu hình sẵn OneSignal plugin với mode development.

---

## 🧪 Test Push Notifications

### Test trên Expo Go (Development):

1. **Khởi chạy app:**
   ```bash
   cd mobile
   npm start
   ```

2. **Đăng nhập vào app** trên thiết bị Android

3. **Kiểm tra OneSignal Dashboard:**
   - Vào **Audience** → **All Users**
   - Bạn sẽ thấy device của mình được đăng ký với External User ID = user ID trong database

### Test Notifications:

#### 1. Test từ OneSignal Dashboard:
   - Vào **Messages** → **New Push**
   - Chọn **Send to Particular Segment**
   - Chọn **All Subscribed Users** hoặc filter theo External User ID
   - Gửi test notification

#### 2. Test qua Backend API:
   ```bash
   # Test notification endpoint
   curl -X POST https://your-backend-url/api/push/test \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json"
   ```

#### 3. Test tự nhiên:
   - Dùng 2 tài khoản khác nhau
   - Tài khoản A gửi tin nhắn cho tài khoản B
   - Tài khoản A thả reaction vào bài viết của tài khoản B
   - Tài khoản A gửi lời mời kết bạn cho tài khoản B
   - Kiểm tra notification trên thiết bị của tài khoản B

---

## 🔧 Kiểm tra Logs

### Mobile App Logs:
```bash
# Xem OneSignal logs trong Expo
npx expo start
# Mở Metro Bundler logs để xem:
# - "OneSignal Player ID: ..."
# - "OneSignal push permission: ..."
# - "OneSignal notification received: ..."
```

### Backend Logs:
```bash
# Kiểm tra logs khi gửi push notification
# Backend sẽ log:
# - [PUSH] Registered OneSignal player ID for user X: ...
# - [OneSignal] Sending notification to X device(s)
# - [OneSignal] Notification sent successfully
```

---

## 📝 Cấu trúc Code

### Mobile (React Native/Expo):

**Files đã thêm/sửa:**
- `mobile/app.json` - Thêm OneSignal plugin
- `mobile/App.js` - Khởi tạo OneSignal
- `mobile/src/services/OneSignalService.js` - Service quản lý OneSignal
- `mobile/src/context/AuthContext.js` - Tích hợp OneSignal vào auth flow

### Backend (Node.js):

**Files đã thêm/sửa:**
- `backend/src/services/oneSignalService.js` - Service gửi notification qua OneSignal API
- `backend/src/controllers/pushTokenController.js` - Cập nhật để hỗ trợ OneSignal Player IDs

**Notifications được gửi tự động từ:**
- `backend/src/controllers/messageController.js` - Tin nhắn mới
- `backend/src/controllers/reactionController.js` - Reactions
- `backend/src/controllers/friendshipController.js` - Kết bạn

---

## ⚙️ Environment Variables

Đã được cấu hình trong Replit Secrets:
- `ONESIGNAL_APP_ID` - OneSignal App ID
- `ONESIGNAL_REST_API_KEY` - OneSignal REST API Key

---

## 🎯 Navigation Handlers

Khi user tap vào notification, app sẽ tự động navigate đến:

| Loại Notification | Screen | Params |
|-------------------|--------|--------|
| Tin nhắn mới | `Chat` | `{userId, userName}` |
| Reaction mới | `PostDetail` | `{postId}` |
| Lời mời kết bạn | `Notifications` | - |
| Kết bạn được chấp nhận | `Notifications` | - |

---

## 🐛 Troubleshooting

### Không nhận được notification:

1. **Kiểm tra OneSignal Dashboard:**
   - Device có được đăng ký không?
   - External User ID đã set chưa?

2. **Kiểm tra permissions:**
   - Android: Settings → Apps → Your App → Notifications (phải bật)

3. **Kiểm tra Backend logs:**
   - `[OneSignal] Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY` → Check environment variables
   - `[PUSH] No push tokens found` → User chưa đăng nhập hoặc chưa grant permission

4. **Kiểm tra Mobile logs:**
   - "OneSignal push permission: false" → User từ chối permission
   - Restart app và grant permission lại

### Build APK thất bại:

1. Đảm bảo `google-services.json` đã được thêm vào `mobile/android/app/`
2. Kiểm tra `eas.json` configuration
3. Chạy `eas build --clear-cache` nếu có lỗi cache

---

## 📚 Tài liệu tham khảo

- [OneSignal React Native SDK](https://documentation.onesignal.com/docs/react-native-sdk-setup)
- [OneSignal REST API](https://documentation.onesignal.com/reference/create-notification)
- [Expo + OneSignal](https://documentation.onesignal.com/docs/expo-sdk-setup)

---

## ✨ Tính năng nâng cao có thể thêm

- [ ] Rich notifications với hình ảnh
- [ ] Action buttons trên notification
- [ ] Notification grouping (gộp nhiều notification)
- [ ] Silent notifications để sync data
- [ ] Badge count trên app icon
- [ ] In-app messaging
- [ ] Email notifications (OneSignal hỗ trợ)

Hệ thống đã sẵn sàng để sử dụng! 🎉
