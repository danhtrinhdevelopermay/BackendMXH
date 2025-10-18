# ✅ Dự án Web đã được tách riêng thành công!

## 📦 Những gì đã được thực hiện:

### 1. **Tạo cấu trúc độc lập cho Web**
```
web/
├── server.js           # Web server riêng (Express)
├── package.json        # Dependencies riêng
├── .env                # Cấu hình môi trường
├── .gitignore          # Git ignore
├── render.yaml         # Cấu hình deploy Render
├── DEPLOY_RENDER.md    # Hướng dẫn deploy chi tiết
├── index.html          # Frontend
├── css/
├── js/
│   └── api.js         # Đã cập nhật để gọi API động
└── assets/
```

### 2. **Backend không còn serve Web**
- Đã xóa `express.static` khỏi backend
- Đã xóa fallback route serve index.html
- Backend giờ chỉ là API server thuần túy

### 3. **Web gọi API động**
- Sử dụng biến môi trường `API_URL` để cấu hình backend URL
- File `/config.js` được tạo động từ server
- Frontend tự động load config và kết nối đúng backend

## 🚀 Cách chạy trên local:

### Backend (Port 5000):
```bash
cd backend
npm start
```

### Web (Port 3000):
```bash
cd web
npm start
```

Truy cập: http://localhost:3000

## 🌐 Deploy lên Render:

### Bước 1: Push code lên GitHub

Tạo branch `web` và push code:

```bash
# Từ thư mục root của project
git checkout -b web
git add .
git commit -m "Separate web project for independent deployment"
git push origin web
```

### Bước 2: Deploy Backend lên Render (nếu chưa)

1. Vào Render Dashboard
2. Tạo **New Web Service**
3. Cấu hình:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Thêm DATABASE_URL, JWT_SECRET, CLOUDINARY_*

4. Lưu lại URL backend, ví dụ:
   ```
   https://shatter-backend.onrender.com
   ```

### Bước 3: Deploy Web lên Render

1. Vào Render Dashboard
2. Tạo **New Web Service**
3. Cấu hình:
   - **Root Directory**: `web`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     API_URL=https://shatter-backend.onrender.com
     NODE_ENV=production
     ```

4. Deploy và nhận URL web, ví dụ:
   ```
   https://shatter-web.onrender.com
   ```

### Bước 4: Cấu hình CORS trên Backend

Cập nhật `backend/server.js` để cho phép web domain:

```javascript
app.use(cors({
  origin: [
    'https://shatter-web.onrender.com',
    'http://localhost:3000'  // Cho development
  ],
  credentials: true
}));
```

Redeploy backend sau khi thay đổi.

## 📝 Lưu ý quan trọng:

### 1. **Environment Variables**

**Web (.env):**
```env
PORT=3000
API_URL=https://your-backend-url.onrender.com
```

**Backend (.env):**
```env
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 2. **CORS Configuration**

Đảm bảo backend chấp nhận requests từ web domain!

### 3. **Mobile App**

Mobile app vẫn kết nối trực tiếp với backend API:
- Không bị ảnh hưởng bởi việc tách web
- Vẫn sử dụng URL backend như cũ

### 4. **Free Tier Render**

- Service sẽ "ngủ" sau 15 phút không hoạt động
- Request đầu tiên mất ~30 giây để "thức dậy"
- Upgrade lên paid plan ($7/tháng) để tránh sleep

## 🎯 Kiểm tra sau khi deploy:

✅ Web app hiển thị đúng giao diện
✅ Có thể đăng ký tài khoản mới
✅ Có thể đăng nhập
✅ Có thể tạo bài viết
✅ Có thể xem news feed
✅ Có thể gửi tin nhắn
✅ Mobile app vẫn hoạt động bình thường

## 📚 Tài liệu tham khảo:

- [DEPLOY_RENDER.md](DEPLOY_RENDER.md) - Hướng dẫn deploy chi tiết
- [Render Documentation](https://render.com/docs)

## 🎉 Hoàn thành!

Giờ bạn đã có:
- ✅ Web app độc lập
- ✅ Backend API độc lập
- ✅ Mobile app độc lập
- ✅ Có thể deploy riêng từng phần

Chúc bạn deploy thành công! 🚀
