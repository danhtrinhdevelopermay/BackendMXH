# Hướng dẫn Setup Keystore cho EAS Build

## 1. Đặt file keystore vào đúng vị trí

Bạn cần copy file keystore của bạn vào:
```
mobile/android/app/release.keystore
```

Nếu bạn đã tạo keystore ở nơi khác, dùng lệnh:
```bash
cp /đường/dẫn/đến/your-keystore.jks mobile/android/app/release.keystore
```

## 2. File credentials.json đã được config sẵn

File `mobile/credentials.json` đã có thông tin:
```json
{
  "android": {
    "keystore": {
      "keystorePath": "android/app/release.keystore",
      "keystorePassword": "shatter2024",
      "keyAlias": "shatter-key",
      "keyPassword": "shatter2024"
    }
  }
}
```

**LƯU Ý:** Đảm bảo thông tin này khớp với keystore của bạn!

## 3. File eas.json đã được config

Đã thêm `"credentialsSource": "local"` vào cả preview và production build.

## 4. Build APK

```bash
cd mobile
eas build --platform android --profile production
```

Khi EAS hỏi về keystore, nó sẽ tự động đọc từ `credentials.json`.

## 5. Kiểm tra SHA-1 của keystore

Để xác nhận SHA-1 fingerprint:
```bash
keytool -list -v -keystore mobile/android/app/release.keystore -alias shatter-key -storepass shatter2024 -keypass shatter2024
```

Bạn sẽ thấy SHA-1 ở dòng `Certificate fingerprints`.

## 6. Bảo mật

**QUAN TRỌNG:** File `credentials.json` và keystore KHÔNG NÊN commit lên git!

Đã được thêm vào `.gitignore`.
