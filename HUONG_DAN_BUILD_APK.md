# Hướng dẫn Build APK cho Shatter

## Ứng dụng đã được cập nhật:
- ✅ Tên app: **Shatter**
- ✅ Logo mới đã được cài đặt
- ✅ Package name: com.shatter.app
- ✅ Icon và splash screen đã cập nhật

## Cách build APK:

### Bước 1: Đăng nhập Expo
Mở terminal và chạy:
```bash
cd mobile
eas login
```

Nhập email và password của tài khoản Expo của bạn.

### Bước 2: Build APK
Sau khi đăng nhập, chạy lệnh:
```bash
eas build --platform android --profile production
```

Hoặc nếu muốn build APK preview (nhanh hơn):
```bash
eas build --platform android --profile preview
```

### Bước 3: Tải APK
Sau khi build xong (khoảng 10-20 phút), bạn sẽ nhận được link để tải APK.

## Lệnh build nhanh:

### Build Production APK:
```bash
cd mobile && eas build --platform android --profile production
```

### Build Preview APK (nhanh hơn):
```bash
cd mobile && eas build --platform android --profile preview
```

## Lưu ý:
- Cần có tài khoản Expo (miễn phí tại https://expo.dev)
- Quá trình build diễn ra trên server của Expo
- APK sẽ được tạo và cung cấp link download
- File APK có thể cài đặt trực tiếp trên thiết bị Android

## Nếu chưa có tài khoản Expo:
1. Truy cập https://expo.dev
2. Đăng ký tài khoản miễn phí
3. Quay lại và chạy `eas login`
