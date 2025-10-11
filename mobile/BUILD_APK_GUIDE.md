# Hướng dẫn Build APK với Expo

## Yêu cầu trước khi bắt đầu

1. **Tài khoản Expo**
   - Đăng ký miễn phí tại: https://expo.dev/signup
   - Lưu lại email và mật khẩu

2. **Cài đặt EAS CLI trên máy tính của bạn**
   ```bash
   npm install -g eas-cli
   ```

## Các bước build APK

### Bước 1: Đăng nhập vào Expo
```bash
cd mobile
eas login
```
Nhập email và mật khẩu tài khoản Expo của bạn.

### Bước 2: Cấu hình project
```bash
eas build:configure
```

### Bước 3: Build APK cho Android

**Để build APK preview (khuyến nghị - nhanh hơn):**
```bash
eas build -p android --profile preview
```

**Hoặc build APK production:**
```bash
eas build -p android --profile production
```

### Bước 4: Chờ build hoàn tất
- Quá trình build sẽ chạy trên server của Expo
- Thời gian: khoảng 10-20 phút
- Bạn có thể theo dõi tiến trình tại: https://expo.dev/accounts/[your-username]/builds

### Bước 5: Tải APK về
Sau khi build xong:
- Bạn sẽ nhận được link tải APK
- Hoặc truy cập https://expo.dev và tải về từ dashboard

## Build APK Local (Không cần Expo Account)

Nếu bạn muốn build local mà không dùng EAS:

```bash
# Cài đặt expo-dev-client
npx expo install expo-dev-client

# Build local
npx expo run:android --variant release
```

**Lưu ý:** Build local cần:
- Android Studio đã cài đặt
- Android SDK
- Java JDK

## Cấu hình đã sẵn sàng

✅ File `eas.json` đã được tạo với 3 build profiles:
- **development**: Cho development build
- **preview**: Tạo APK để test (khuyến nghị)
- **production**: APK phiên bản chính thức

✅ File `app.json` đã có đầy đủ cấu hình:
- Package name: `com.socialmedia.app`
- API URL đã được cấu hình đúng

## Lưu ý quan trọng

1. **API URL**: APK sẽ kết nối đến backend qua URL:
   ```
   https://b0f4cf19-856b-4c85-94aa-7e706915c721-00-1ot8heuucu3xd.pike.replit.dev
   ```
   
2. **Nếu backend URL thay đổi**: Cập nhật trong `mobile/app.json` ở phần `extra.apiUrl`

3. **Build lần đầu**: Expo sẽ yêu cầu tạo keystore để ký APK. Chọn "Generate new keystore" để Expo tự động tạo.

## Các lệnh hữu ích

```bash
# Xem danh sách builds
eas build:list

# Hủy build đang chạy
eas build:cancel

# Build và submit lên Google Play Store
eas submit -p android

# Xem logs của build
eas build:view [build-id]
```

## Hỗ trợ

- Tài liệu EAS Build: https://docs.expo.dev/build/introduction/
- Discord Expo: https://chat.expo.dev/
