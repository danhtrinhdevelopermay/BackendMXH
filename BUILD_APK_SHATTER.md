# 📱 Build APK cho Shatter

## ✅ Đã cập nhật xong:
- **Tên ứng dụng:** Shatter
- **Logo mới:** ✅ Đã cài đặt
- **Icon & Splash screen:** ✅ Đã cập nhật
- **Package name:** com.shatter.app

---

## 🚀 Cách build APK nhanh nhất:

### **Bước 1: Đăng nhập Expo**
```bash
cd mobile
eas login
```

*Nếu chưa có tài khoản, đăng ký miễn phí tại: https://expo.dev*

### **Bước 2: Chạy script build**
```bash
./build-apk.sh
```

Script sẽ hỏi bạn chọn:
- **Option 1:** Preview APK (build nhanh, dùng để test)
- **Option 2:** Production APK (build chính thức)

---

## 📋 Hoặc build thủ công:

### Build Preview APK (nhanh hơn):
```bash
cd mobile
eas build --platform android --profile preview
```

### Build Production APK:
```bash
cd mobile
eas build --platform android --profile production
```

---

## 📥 Sau khi build xong:

1. Bạn sẽ nhận được **link tải APK** ngay trên terminal
2. Hoặc xem tất cả builds tại: https://expo.dev/accounts/[your-account]/projects/shatter-social/builds
3. Tải APK về và cài đặt trên điện thoại Android

---

## ⏱️ Thời gian build:
- Preview: ~10-15 phút
- Production: ~15-20 phút

---

## 🔧 Thông tin kỹ thuật:
- **Platform:** Android
- **Package:** com.shatter.app
- **Version:** 1.0.0
- **Build tool:** EAS Build
- **Config file:** mobile/eas.json

---

## ❓ Nếu gặp lỗi:

### Lỗi: "Not logged in"
```bash
eas login
```

### Lỗi: "Project not found"
```bash
cd mobile
eas build:configure
```

### Xem logs build:
```bash
eas build:list
```

---

## 📝 Lưu ý quan trọng:
- ✅ Cần kết nối internet
- ✅ Build diễn ra trên cloud (Expo server)
- ✅ APK có thể cài trực tiếp trên Android
- ✅ Không cần Android Studio hay máy Mac
