# Shatter Web

Phiên bản web của ứng dụng mạng xã hội Shatter, được chuyển đổi từ Expo React Native.

## Cấu trúc dự án

```
web/
├── assets/          # Tài nguyên hình ảnh, icons
├── src/             # Mã nguồn chính
│   ├── api/         # API calls
│   ├── components/  # React components
│   ├── context/     # React Context
│   ├── hooks/       # Custom hooks
│   ├── navigation/  # Điều hướng
│   ├── screens/     # Các màn hình
│   ├── services/    # Services (Socket, Notifications)
│   └── utils/       # Utilities (storage wrapper)
├── App.js           # Component gốc
├── app.json         # Cấu hình Expo
├── package.json     # Dependencies
└── render.yaml      # Cấu hình deploy Render
```

## Chạy trên môi trường local

### Chế độ development:
```bash
cd web
npm install
npm start
```

### Build cho production:
```bash
cd web
npm install
npm run build
npm run serve
```

## Deploy lên Render

### Bước 1: Push code lên GitHub
```bash
git add .
git commit -m "Add web version"
git push origin main
```

### Bước 2: Tạo Web Service trên Render
1. Đăng nhập vào [Render](https://render.com)
2. Click **New +** → **Web Service**
3. Kết nối repository GitHub của bạn
4. Cấu hình như sau:
   - **Name**: shatter-web (hoặc tên bạn muốn)
   - **Root Directory**: web
   - **Environment**: Node
   - **Build Command**: `npm install && npx expo export:web`
   - **Start Command**: `npx serve web-build -l $PORT`
   - **Plan**: Free

5. Click **Create Web Service**

### Bước 3: Đợi deployment hoàn tất
Render sẽ tự động build và deploy ứng dụng. Quá trình này có thể mất 5-10 phút.

## Các tính năng được điều chỉnh cho Web

### ✅ Hoạt động tốt trên web:
- Đăng nhập / Đăng ký
- Newsfeed
- Đăng bài, bình luận, reactions
- Tin nhắn realtime (Socket.IO)
- Tìm kiếm người dùng
- Profile management
- Stories
- Thoughts

### ⚠️ Giới hạn trên web:
- **Push Notifications**: Không hoạt động (chỉ hỗ trợ trên mobile)
- **Voice Calls**: Có thể gặp vấn đề với permissions (chưa test đầy đủ)
- **Image Upload**: Có thể khác so với mobile (sử dụng web file picker)

## Điều chỉnh kỹ thuật

### Storage
- Mobile: Sử dụng `expo-secure-store`
- Web: Sử dụng `localStorage`
- Wrapper: `src/utils/storage.js`

### Notifications
- Mobile: Sử dụng `expo-notifications`
- Web: Bị disable (không hỗ trợ)
- Service: `src/services/notificationService.js`

## Environment Variables

Ứng dụng sử dụng API URL từ `app.json`:
```json
{
  "extra": {
    "apiUrl": "https://backendmxh-1.onrender.com"
  }
}
```

Để thay đổi API URL, chỉnh sửa file `app.json`.

## Troubleshooting

### Lỗi khi build
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### Lỗi khi chạy trên web
- Kiểm tra browser console để xem lỗi chi tiết
- Đảm bảo backend API đang chạy
- Kiểm tra CORS settings trên backend

## Công nghệ sử dụng

- **Expo** ~54.0.0
- **React** 19.1.0
- **React Native Web** ~0.20.0
- **React Navigation** ^6.x
- **Socket.IO Client** ^4.8.1
- **Axios** ^1.6.2
- **React Native Paper** ^5.11.3

## License

Private
