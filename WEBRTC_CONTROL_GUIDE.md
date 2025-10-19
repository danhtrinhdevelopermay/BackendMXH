# 🎛️ WebRTC Control Panel - Hướng Dẫn Sử Dụng

## Vấn Đề
WebRTC (`react-native-webrtc`) yêu cầu native code và **không thể chạy trên Expo Go**. Điều này gây khó khăn khi phát triển và test các tính năng khác của ứng dụng.

## Giải Pháp
Trang điều khiển WebRTC cho phép bạn **bật/tắt** tính năng WebRTC từ xa, giúp:
- ✅ Test app trên Expo Go khi **TẮT** WebRTC (chỉ UI, không có audio thật)
- ✅ Sử dụng audio call thật khi **BẬT** WebRTC (cần Development Build)

---

## 📱 Cách Sử Dụng

### Bước 1: Truy Cập Trang Điều Khiển

Mở trình duyệt và truy cập:

**Local (Development):**
```
http://localhost:3000/webrtc-control
```

**Production (Render.com):**
```
https://backendmxh-1.onrender.com/webrtc-control
```

### Bước 2: Bật/Tắt WebRTC

Trên trang điều khiển, bạn sẽ thấy:
- **Trạng thái hiện tại**: WebRTC đang BẬT hay TẮT
- **Nút Bật WebRTC**: Kích hoạt tính năng audio call thật
- **Nút Tắt WebRTC**: Tắt để test trên Expo Go

### Bước 3: Test Ứng Dụng

**Khi TẮT WebRTC (Mặc định):**
- App chạy được trên Expo Go ✅
- Giao diện call hoạt động bình thường
- Hiển thị badge "📱 UI Mode (No Audio)" ở màn hình call
- Không có âm thanh thực (chỉ demo UI)

**Khi BẬT WebRTC:**
- Cần build Development Build (không dùng Expo Go được)
- Có tính năng audio call thật ✅
- Nút mute/speaker hoạt động thực sự

---

## 🔧 Chi Tiết Kỹ Thuật

### Backend API Endpoints

**GET /api/webrtc-status**
```json
{
  "enabled": false
}
```

**POST /api/webrtc-status**
```json
{
  "enabled": true
}
```

Response:
```json
{
  "enabled": true,
  "message": "WebRTC đã bật"
}
```

### Mobile App Logic

App tự động kiểm tra trạng thái WebRTC khi mở màn hình call:

1. **Tắt WebRTC**: Sử dụng `MockWebRTCService` (chỉ UI)
2. **Bật WebRTC**: Sử dụng `WebRTCService` (audio thật)

Code kiểm tra:
```javascript
import { getWebRTCStatus } from '../config/constants';

const enabled = await getWebRTCStatus();
if (enabled) {
  // Dùng WebRTC thật
} else {
  // Dùng Mock (UI only)
}
```

---

## 📊 Workflow Phát Triển

### Workflow 1: Test Trên Expo Go (Nhanh)
```
1. Truy cập /webrtc-control
2. Nhấn "Tắt WebRTC"
3. Mở app trên Expo Go
4. Test các tính năng (posts, messages, friends, etc.)
5. Tính năng call chỉ hiển thị UI (không có audio)
```

### Workflow 2: Test Audio Call Thật
```
1. Build Development Build:
   cd mobile
   npx expo install expo-dev-client
   eas build --profile development --platform android

2. Cài app vừa build
3. Truy cập /webrtc-control
4. Nhấn "Bật WebRTC"
5. Test tính năng call với audio thật
```

---

## 🎯 Khi Nào Dùng Gì?

| Tình huống | WebRTC | Tool |
|-----------|--------|------|
| Phát triển tính năng mới | TẮT | Expo Go |
| Test UI/UX | TẮT | Expo Go |
| Test các tính năng khác | TẮT | Expo Go |
| Test audio call | BẬT | Development Build |
| Production | BẬT | Production Build |

---

## ⚙️ Cấu Hình

WebRTC mặc định là **TẮT** để tương thích với Expo Go.

Để thay đổi mặc định, sửa trong `backend/server.js`:
```javascript
let webrtcEnabled = false; // Đổi thành true nếu muốn
```

---

## 🔍 Troubleshooting

**Q: Tại sao trang điều khiển không load được?**  
A: Kiểm tra backend có đang chạy không. Truy cập `/health` để xác nhận.

**Q: Đã bật WebRTC nhưng vẫn lỗi trên Expo Go?**  
A: WebRTC không thể chạy trên Expo Go. Bạn phải build Development Build.

**Q: Tắt WebRTC rồi nhưng app vẫn lỗi?**  
A: Reload lại app (shake device > Reload) hoặc scan QR code lại.

---

## 📝 Lưu Ý

- Trạng thái WebRTC được lưu trong **memory** của backend server
- Khi restart backend, trạng thái reset về **TẮT**
- Nhiều người có thể cùng truy cập trang điều khiển
- Thay đổi áp dụng ngay lập tức cho tất cả mobile clients

---

## 🚀 Production

Khi deploy production, nên:
1. Bật WebRTC vĩnh viễn
2. Build production app với WebRTC
3. Tắt quyền truy cập trang điều khiển (thêm authentication)
