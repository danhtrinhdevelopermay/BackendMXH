# Hướng Dẫn Build APK Expo

## Phương Pháp 1: Build APK Bằng EAS Build (Khuyến Nghị)

### Bước 1: Cài Đặt EAS CLI
```bash
npm install -g eas-cli
```

### Bước 2: Đăng Nhập Expo
```bash
eas login
```
Nhập email và password tài khoản Expo của bạn

### Bước 3: Cấu Hình EAS Build
```bash
cd mobile
eas build:configure
```
- Chọn platform: **Android**
- Chọn profile: **production**

### Bước 4: Build APK
```bash
eas build -p android --profile preview
```

**Hoặc build AAB (cho Google Play Store):**
```bash
eas build -p android --profile production
```

### Bước 5: Tải APK
- Sau khi build xong, EAS sẽ cho link download
- Hoặc vào https://expo.dev/accounts/[your-username]/projects/social-media-mobile/builds
- Download APK về máy

---

## Phương Pháp 2: Build APK Local (Nhanh Hơn)

### Yêu Cầu:
- Android Studio đã cài đặt
- Java JDK 17

### Lệnh Build:
```bash
cd mobile
npx expo run:android --variant release
```

APK sẽ được tạo tại:
```
mobile/android/app/build/outputs/apk/release/app-release.apk
```

---

## File Cấu Hình EAS Build (eas.json)

Tạo file `mobile/eas.json`:
```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Các Profile Build

### Preview (APK để test)
```bash
eas build -p android --profile preview
```
- Tạo file APK
- Cài được trực tiếp trên điện thoại
- Dùng để test trước khi lên store

### Production (AAB cho Google Play)
```bash
eas build -p android --profile production
```
- Tạo file AAB (Android App Bundle)
- Chỉ upload lên Google Play Store
- Không cài trực tiếp được

---

## Lưu Ý Quan Trọng

### 1. Đảm Bảo Cấu Hình app.json Đúng
- `bundleIdentifier` (iOS) và `package` (Android) phải unique
- Đã có trong file hiện tại: `com.socialmedia.app`

### 2. API URL
- Đảm bảo `apiUrl` trong app.json đang trỏ đến Render:
  ```json
  "apiUrl": "https://backendmxh.onrender.com"
  ```

### 3. Build Lần Đầu
- EAS build lần đầu sẽ mất 10-20 phút
- Các lần sau nhanh hơn (5-10 phút)

### 4. Free Tier EAS
- 30 builds/tháng miễn phí
- Đủ cho development và testing

---

## Troubleshooting

### Lỗi "ANDROID_SDK_ROOT not set"
```bash
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
```

### Lỗi "Java version"
Cần Java JDK 17:
```bash
# macOS
brew install openjdk@17

# Ubuntu/Debian
sudo apt install openjdk-17-jdk
```

### Build bị lỗi trên EAS
Xem logs chi tiết tại: https://expo.dev/accounts/[username]/projects/[project]/builds

---

## Cài APK Lên Điện Thoại

### Cách 1: Download trực tiếp trên điện thoại
1. Mở link download từ EAS trên điện thoại
2. Download APK
3. Mở file APK → Cài đặt
4. Bật "Install from Unknown Sources" nếu cần

### Cách 2: Transfer từ máy tính
1. Download APK về máy
2. Copy vào điện thoại qua USB/AirDrop/Google Drive
3. Mở File Manager → Tìm APK → Cài đặt

---

## Build iOS (IPA)

```bash
eas build -p ios --profile production
```

**Lưu ý:** 
- Cần Apple Developer Account ($99/năm)
- Chỉ test được trên thiết bị đã đăng ký UDID
