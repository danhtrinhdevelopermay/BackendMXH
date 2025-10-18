# ⚡ Quick Start - Deploy lên Render

Hướng dẫn nhanh 15 phút deploy Shatter lên Render.

---

## 🎯 Tóm tắt nhanh:

```
1. Tạo PostgreSQL Database trên Render
2. Deploy Backend → Lấy URL backend
3. Deploy Web App → Cập nhật API_URL
4. Cấu hình CORS
5. Test và enjoy!
```

---

## 📝 Các bước thực hiện:

### **BƯỚC 1: Tạo Database (2 phút)**

1. Vào [Render Dashboard](https://dashboard.render.com/)
2. New + → PostgreSQL
3. Name: `shatter-db`
4. Free tier → Create
5. **Copy "Internal Database URL"** → Lưu lại!

---

### **BƯỚC 2: Deploy Backend (5 phút)**

1. New + → Web Service
2. Connect GitHub repository
3. Cấu hình:
   ```
   Name: shatter-backend
   Root Directory: backend
   Build: npm install
   Start: npm start
   ```

4. Add Environment Variables:
   ```
   NODE_ENV=production
   JWT_SECRET=<tạo-chuỗi-ngẫu-nhiên-phức-tạp>
   DATABASE_URL=<paste-url-từ-bước-1>
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
   CLOUDINARY_API_KEY=<your-cloudinary-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-secret>
   ```

5. Create Web Service
6. **Copy URL backend** (ví dụ: `https://shatter-backend.onrender.com`)

---

### **BƯỚC 3: Deploy Web (3 phút)**

1. New + → Web Service
2. Connect cùng repository
3. Cấu hình:
   ```
   Name: shatter-web
   Root Directory: web
   Build: npm install
   Start: npm start
   ```

4. Add Environment Variables:
   ```
   NODE_ENV=production
   API_URL=<paste-backend-url-từ-bước-2>
   ```
   Ví dụ: `API_URL=https://shatter-backend.onrender.com`

5. Create Web Service
6. **Copy URL web** (ví dụ: `https://shatter-web.onrender.com`)

---

### **BƯỚC 4: Cấu hình CORS (2 phút)**

1. Sửa file `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'https://shatter-web.onrender.com',  // Thay bằng URL web của bạn
    'http://localhost:3000'
  ],
  credentials: true
}));
```

2. Push code:
```bash
git add backend/server.js
git commit -m "Update CORS for production"
git push origin main
```

Render tự động redeploy backend.

---

### **BƯỚC 5: Chạy Database Migration (2 phút)**

1. Vào Backend service → Shell tab
2. Chạy:
   ```bash
   npm run db:push
   ```

Hoặc kết nối database và import file `backend/schema.sql`

---

### **BƯỚC 6: Test (1 phút)**

✅ Truy cập Web URL: `https://shatter-web.onrender.com`

✅ Test các chức năng:
- Đăng ký tài khoản
- Đăng nhập
- Tạo bài viết
- Upload ảnh

---

## 🎉 Xong!

**URLs của bạn:**
- Backend API: `https://shatter-backend.onrender.com`
- Web App: `https://shatter-web.onrender.com`

---

## ⚠️ Lưu ý Free Tier:

- Service ngủ sau 15 phút không hoạt động
- Request đầu tiên mất ~30 giây để "thức dậy"
- Upgrade $7/tháng để tránh sleep

---

## 📚 Hướng dẫn chi tiết:

Xem file [HUONG_DAN_DEPLOY_RENDER.md](HUONG_DAN_DEPLOY_RENDER.md) để biết thêm:
- Troubleshooting
- Best practices
- Advanced configurations
- Security tips

---

**Happy deploying! 🚀**
