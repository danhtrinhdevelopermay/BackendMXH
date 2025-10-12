# Hướng Dẫn Build iOS Miễn Phí

## 🎯 Tóm Tắt Nhanh

### Build iOS Simulator (Miễn Phí 100%)
```bash
cd mobile
eas build -p ios --profile preview
```

---

## 📱 Các Phương Pháp Build iOS

### Phương Pháp 1: Simulator Build (Miễn Phí - Không Cần Apple Account)

**Ưu điểm:**
- ✅ Hoàn toàn miễn phí
- ✅ Không cần Apple Developer Account
- ✅ Build nhanh (5-10 phút)

**Nhược điểm:**
- ❌ Chỉ chạy trên Xcode Simulator (máy Mac)
- ❌ Không cài được lên iPhone/iPad thật

**Lệnh build:**
```bash
cd mobile
eas build -p ios --profile preview
```

---

### Phương Pháp 2: Device Build (Cần Apple Developer Account - $99/năm)

**Ưu điểm:**
- ✅ Cài được lên iPhone/iPad thật
- ✅ Test được trên thiết bị thực tế
- ✅ Có thể phát hành lên App Store

**Nhược điểm:**
- ❌ Cần trả $99/năm cho Apple Developer Account
- ❌ Phải đăng ký UDID của thiết bị

**Lệnh build:**
```bash
cd mobile
eas build -p ios --profile production
```

---

## 🚀 Các Bước Build iOS Simulator (Miễn Phí)

### Bước 1: Cài Đặt EAS CLI
```bash
npm install -g eas-cli
```

### Bước 2: Đăng Nhập Expo
```bash
eas login
```
Nhập email và password tài khoản Expo của bạn (đăng ký miễn phí tại expo.dev)

### Bước 3: Build iOS Simulator
```bash
cd mobile
eas build -p ios --profile preview
```

### Bước 4: Đợi Build Hoàn Tất
- Build lần đầu: 10-20 phút
- Các lần sau: 5-10 phút
- Theo dõi progress trên terminal

### Bước 5: Tải File .tar.gz
Sau khi build xong, EAS sẽ cho link download file `.tar.gz`

### Bước 6: Chạy Trên Xcode Simulator (Máy Mac)
1. Giải nén file `.tar.gz`:
   ```bash
   tar -xvf your-app.tar.gz
   ```

2. Kéo thả folder `.app` vào Xcode Simulator:
   - Mở Xcode
   - Mở Simulator (Xcode → Open Developer Tool → Simulator)
   - Kéo thả file `.app` vào cửa sổ Simulator

3. App sẽ tự động cài đặt và mở

---

## 🎁 Giải Pháp Thay Thế Miễn Phí

### Option 1: Expo Go (Đang Dùng - Miễn Phí 100%)
**Khuyến nghị cho development**

```bash
cd mobile
npx expo start
```

- Scan QR code bằng Expo Go app
- Test trực tiếp trên iPhone
- Không cần build, không cần Apple account
- Update real-time khi sửa code

**Hạn chế:**
- Không dùng được native modules bên ngoài Expo SDK
- Có logo "Expo Go" khi mở app

### Option 2: Expo Development Build
```bash
eas build -p ios --profile development
```

- Cài được custom native modules
- Vẫn có hot-reload như Expo Go
- **Cần Apple Developer Account ($99/năm)**

### Option 3: TestFlight (Cho Beta Testing)
```bash
# Build production
eas build -p ios --profile production

# Submit lên TestFlight
eas submit -p ios
```

- Chia sẻ app cho max 10,000 beta testers
- Người dùng cài qua TestFlight app (miễn phí)
- **Cần Apple Developer Account ($99/năm)**

---

## ⚙️ Cấu Hình File `eas.json`

File đã được cấu hình sẵn:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

**Giải thích:**
- `preview`: Build simulator cho iOS, APK cho Android (miễn phí)
- `production`: Build cho App Store/Google Play (cần developer accounts)

---

## 📊 So Sánh Các Phương Pháp

| Phương Pháp | Chi Phí | Apple Account | Cài Lên iPhone Thật | Thời Gian Build |
|-------------|---------|---------------|---------------------|-----------------|
| **Expo Go** | Miễn phí | Không cần | ✅ Có | 0 (chạy ngay) |
| **Simulator Build** | Miễn phí | Không cần | ❌ Không | 10-20 phút |
| **Device Build** | $99/năm | Cần | ✅ Có | 10-20 phút |
| **TestFlight** | $99/năm | Cần | ✅ Có | 15-30 phút |

---

## 🔧 Troubleshooting

### Lỗi "Must have an Apple Developer account"
- Dùng profile `preview` thay vì `production`
- Thêm flag `--simulator` để build simulator

### Lỗi "No devices registered"
- Đây là lỗi khi build device mà chưa đăng ký UDID
- Dùng simulator build hoặc đăng ký Apple Developer Account

### Build bị failed
1. Kiểm tra logs tại: https://expo.dev/accounts/[username]/projects/[project]/builds
2. Đảm bảo `app.json` có đủ thông tin:
   - `bundleIdentifier` phải unique (vd: `com.socialmedia.app`)
   - `version` và `buildNumber` đã đúng

### Không có máy Mac
- Không thể chạy simulator build (chỉ chạy trên Mac)
- **Giải pháp:** Dùng Expo Go để test trên iPhone
- Hoặc thuê dịch vụ cloud Mac (MacStadium, MacinCloud)

---

## 💡 Khuyến Nghị

### Cho Development (Test App):
✅ **Dùng Expo Go** - Miễn phí, nhanh, tiện lợi

### Cho Testing Nội Bộ (Chia sẻ cho team):
✅ **Dùng TestFlight** - Cần $99/năm nhưng chuyên nghiệp

### Cho Phát Hành Public:
✅ **Submit lên App Store** - Cần $99/năm

---

## 📝 Checklist Trước Khi Build

- [ ] Đã cài `eas-cli`: `npm install -g eas-cli`
- [ ] Đã đăng nhập Expo: `eas login`
- [ ] File `app.json` có `bundleIdentifier` đúng
- [ ] API URL trong `app.json` đã trỏ đúng backend
- [ ] Đã test app trên Expo Go trước

---

## 🆓 EAS Build Free Tier

**Hạn mức miễn phí:**
- 30 builds/tháng (tất cả platforms)
- Đủ cho development và testing
- Build nhanh, ổn định

**Nâng cấp (nếu cần):**
- EAS Production: $29/tháng
- 500 builds/tháng
- Priority queue (build nhanh hơn)

---

## 📚 Tài Liệu Tham Khảo

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [iOS Simulator Build](https://docs.expo.dev/build-reference/simulators/)
- [TestFlight Guide](https://docs.expo.dev/submit/ios/)
