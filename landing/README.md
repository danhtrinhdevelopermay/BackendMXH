# Shatter Landing Page

Landing page hiện đại cho ứng dụng Shatter với dark theme và glassmorphism effects.

## 🚀 Tính năng

- **Dark Theme:** Giao diện tối chuyên nghiệp với gradient effects
- **Glassmorphism:** Hiệu ứng kính trong suốt hiện đại
- **Responsive Design:** Tối ưu cho mọi thiết bị
- **Smooth Animations:** Animations mượt mà và chuyên nghiệp
- **Download Links:** Link tải iOS và Android app
- **Privacy Policy:** Chính sách bảo mật chi tiết
- **Install Guide:** Hướng dẫn cài đặt từng bước
- **Anti-Spindown System:** Tự động ping để ngăn server ngủ trên Render

## 🛡️ Hệ thống Chống Spindown

Landing page được trang bị hệ thống tự ping để ngăn Render.com spindown do inactivity:

### Cách hoạt động:
- Server tự ping endpoint `/health` mỗi **14 phút**
- Chỉ hoạt động khi deploy trên Render (production)
- Tắt tự động trong development để tiết kiệm resources
- Logs đầy đủ để theo dõi hoạt động

### Cấu hình:

```javascript
const RENDER_URL = process.env.RENDER_URL || 'https://shattering.onrender.com';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
```

### Environment Variables:
- `RENDER_URL`: URL của landing page trên Render (optional)
- `RENDER`: Biến tự động set bởi Render để detect production

### Monitor Logs:
Check Render logs để xem self-ping hoạt động:
```
🔄 Anti-spindown system activated for https://shattering.onrender.com
✅ Self-ping successful at 2025-01-19T10:00:00.000Z: Status 200
```

## 📦 Cài đặt

```bash
cd landing
npm install
npm start
```

Server sẽ chạy trên `http://localhost:3000`

## 🌐 Deploy lên Render

1. **Tạo Web Service mới trên Render.com**
2. **Connect GitHub repository**
3. **Cấu hình:**
   - **Build Command:** `cd landing && npm install`
   - **Start Command:** `cd landing && npm start`
   - **Root Directory:** `/` (hoặc để trống)

4. **Environment Variables (Optional):**
   - `RENDER_URL`: `https://your-app-name.onrender.com`

5. **Deploy!** 🚀

### Lưu ý về file lớn:

File APK (~72MB) và iOS tar.gz (~21MB) được lưu trong `public/downloads/`. 

**Các lựa chọn:**

#### Option 1: Git LFS (Khuyến nghị)
```bash
git lfs install
git lfs track "*.apk"
git lfs track "*.tar.gz"
git add .gitattributes
git add landing/public/downloads/*
git commit -m "Add app downloads with LFS"
git push
```

#### Option 2: Cloudinary/S3
Upload file lên Cloudinary hoặc AWS S3 và update link trong `index.html`:
```html
<a href="https://your-cloudinary-url/Shatter-Android.apk" ...>
<a href="https://your-cloudinary-url/Shatter-iOS.tar.gz" ...>
```

## 📁 Cấu trúc

```
landing/
├── public/
│   ├── downloads/
│   │   ├── Shatter-Android.apk
│   │   └── Shatter-iOS.tar.gz
│   ├── index.html
│   ├── privacy-policy.html
│   ├── install-guide.html
│   └── styles.css
├── server.js
├── package.json
├── .gitattributes
└── README.md
```

## 🎨 Thiết kế

- **Framework:** Vanilla HTML/CSS/JS
- **Font:** Inter (Google Fonts)
- **Color Scheme:**
  - Primary: `#667eea` (Purple-Blue)
  - Secondary: `#764ba2` (Purple)
  - Accent: `#00d4ff` (Cyan)
  - Background: `#0a0e27` (Dark Blue)

## 📄 Pages

- `/` - Trang chủ (Hero, Features, About, Download)
- `/privacy-policy` - Chính sách bảo mật
- `/install-guide` - Hướng dẫn cài đặt
- `/health` - Health check endpoint (cho anti-spindown)

## 🔧 Maintenance

### Cập nhật App Files:
1. Build app mới từ Expo
2. Copy file vào `public/downloads/`
3. Commit và push

### Test Anti-Spindown:
1. Deploy lên Render
2. Xem logs trong Render Dashboard
3. Tìm dòng log: `✅ Self-ping successful...`
4. Verify ping mỗi 14 phút

## 📞 Support

- Email: support@shatter.app
- Help: help@shatter.app

## 📝 License

MIT License - Shatter 2025
