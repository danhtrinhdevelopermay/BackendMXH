# 🚀 Hướng Dẫn Deploy Shatter lên Render

Hướng dẫn chi tiết để deploy Backend API và Web App của dự án Shatter lên Render.

---

## 📋 Mục lục

1. [Chuẩn bị](#1-chuẩn-bị)
2. [Deploy Backend API](#2-deploy-backend-api)
3. [Deploy Web App](#3-deploy-web-app)
4. [Cấu hình CORS](#4-cấu-hình-cors)
5. [Kiểm tra và Test](#5-kiểm-tra-và-test)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Chuẩn bị

### ✅ Yêu cầu:
- Tài khoản GitHub
- Tài khoản Render (miễn phí tại [render.com](https://render.com))
- Code đã push lên GitHub

### 📦 Push code lên GitHub:

```bash
# Tạo branch mới cho deployment
git checkout -b production

# Add tất cả thay đổi
git add .

# Commit
git commit -m "Prepare for Render deployment"

# Push lên GitHub
git push origin production
```

---

## 2. Deploy Backend API

### Bước 1: Tạo PostgreSQL Database trên Render

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → Chọn **"PostgreSQL"**
3. Cấu hình database:
   ```
   Name: shatter-db
   Database: shatter_production
   User: shatter_user
   Region: Singapore (hoặc gần nhất)
   PostgreSQL Version: 16
   ```
4. Chọn **Free tier**
5. Click **"Create Database"**
6. **Lưu lại Internal Database URL** (dùng cho backend)

### Bước 2: Chuẩn bị Cloudinary

Nếu chưa có tài khoản Cloudinary:

1. Đăng ký tại [cloudinary.com](https://cloudinary.com)
2. Lấy thông tin sau từ Dashboard:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### Bước 3: Deploy Backend Service

1. Trong Render Dashboard, click **"New +"** → **"Web Service"**
2. Kết nối GitHub repository của bạn
3. Chọn repository và branch `production`

#### Cấu hình Service:

| Field | Value |
|-------|-------|
| **Name** | `shatter-backend` |
| **Region** | Singapore |
| **Branch** | `production` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

#### Environment Variables:

Click **"Advanced"** → **"Add Environment Variable"**, thêm các biến sau:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL=[Paste Internal Database URL từ bước 1]
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**⚠️ Quan trọng:**
- Thay `JWT_SECRET` bằng một chuỗi ngẫu nhiên phức tạp
- `DATABASE_URL` lấy từ PostgreSQL database đã tạo ở bước 1
- Thay thông tin Cloudinary bằng thông tin thực của bạn

4. Click **"Create Web Service"**
5. Đợi 3-5 phút để Render build và deploy
6. **Lưu lại URL backend**, ví dụ:
   ```
   https://shatter-backend.onrender.com
   ```

### Bước 4: Chạy Database Migration

Sau khi backend deploy xong:

1. Vào service **shatter-backend**
2. Click **"Shell"** tab
3. Chạy lệnh tạo bảng (nếu có migration script):
   ```bash
   npm run db:push
   ```

Hoặc kết nối trực tiếp database và chạy file `backend/schema.sql`.

---

## 3. Deploy Web App

### Bước 1: Cập nhật API URL trong code

Trước khi deploy web, cập nhật URL backend:

```bash
# Sửa file web/.env
nano web/.env
```

Thay đổi:
```env
PORT=3000
API_URL=https://shatter-backend.onrender.com
```

Commit và push:
```bash
git add web/.env
git commit -m "Update API URL for production"
git push origin production
```

### Bước 2: Deploy Web Service

1. Trong Render Dashboard, click **"New +"** → **"Web Service"**
2. Chọn cùng repository như backend
3. Chọn branch `production`

#### Cấu hình Service:

| Field | Value |
|-------|-------|
| **Name** | `shatter-web` |
| **Region** | Singapore |
| **Branch** | `production` |
| **Root Directory** | `web` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

#### Environment Variables:

```env
NODE_ENV=production
PORT=3000
API_URL=https://shatter-backend.onrender.com
```

4. Click **"Create Web Service"**
5. Đợi 2-3 phút để deploy
6. **Lưu lại URL web**, ví dụ:
   ```
   https://shatter-web.onrender.com
   ```

---

## 4. Cấu hình CORS

Để web app có thể gọi API từ backend, cần cấu hình CORS.

### Cập nhật Backend CORS:

1. Sửa file `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'https://shatter-web.onrender.com',  // Web production URL
    'http://localhost:3000',              // Local development
    'http://localhost:5000'               // Local development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

2. Commit và push:

```bash
git add backend/server.js
git commit -m "Update CORS for production"
git push origin production
```

Render sẽ tự động redeploy backend khi phát hiện thay đổi.

---

## 5. Kiểm tra và Test

### ✅ Checklist sau khi deploy:

#### Backend API:

Truy cập: `https://shatter-backend.onrender.com`

```bash
# Test root endpoint
curl https://shatter-backend.onrender.com/

# Kết quả mong đợi:
{
  "message": "Shatter Backend API",
  "version": "1.0.0",
  "status": "running"
}

# Test health check
curl https://shatter-backend.onrender.com/health

# Kết quả mong đợi:
{
  "status": "ok",
  "timestamp": "2025-10-18T...",
  "uptime": 123.45
}
```

#### Web App:

Truy cập: `https://shatter-web.onrender.com`

Kiểm tra:
- [x] Trang web hiển thị đúng giao diện
- [x] Form đăng ký hoạt động
- [x] Đăng nhập thành công
- [x] Tạo bài viết được
- [x] Xem news feed
- [x] Gửi tin nhắn
- [x] Upload ảnh (Cloudinary)

---

## 6. Troubleshooting

### ❌ Lỗi thường gặp:

#### 1. **Backend: "Cannot connect to database"**

**Nguyên nhân:** DATABASE_URL sai hoặc database chưa tạo bảng

**Giải pháp:**
```bash
# Kiểm tra DATABASE_URL trong Environment Variables
# Chạy migration để tạo bảng
npm run db:push
```

#### 2. **Web: "Failed to fetch" khi gọi API**

**Nguyên nhân:** CORS chưa được cấu hình đúng hoặc API URL sai

**Giải pháp:**
- Kiểm tra `API_URL` trong web environment variables
- Kiểm tra CORS config trong backend
- Xem browser console để biết lỗi chi tiết

#### 3. **Backend: "Cloudinary upload failed"**

**Nguyên nhân:** Cloudinary credentials sai

**Giải pháp:**
```bash
# Kiểm tra lại các biến:
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

#### 4. **Service "sleeping" (Free tier)**

**Hành vi:** App ngủ sau 15 phút không hoạt động, request đầu tiên mất ~30 giây

**Giải pháp:**
- Chấp nhận điều này với free tier
- Upgrade lên paid plan ($7/tháng) để tránh sleep
- Sử dụng cron job để ping định kỳ (không khuyến khích)

#### 5. **Build Failed**

**Nguyên nhân:** Dependencies thiếu hoặc Node version không tương thích

**Giải pháp:**
```bash
# Kiểm tra package.json có đủ dependencies
# Chỉ định Node version trong package.json:
"engines": {
  "node": ">=18.0.0"
}
```

---

## 📊 URLs Tổng Hợp

Sau khi deploy thành công:

| Service | URL | Mục đích |
|---------|-----|----------|
| **Backend API** | `https://shatter-backend.onrender.com` | API server cho cả web và mobile |
| **Web App** | `https://shatter-web.onrender.com` | Ứng dụng web |
| **Database** | `postgresql://...` | PostgreSQL database |

---

## 🔄 Auto-Deploy

Render tự động redeploy khi bạn push code mới lên branch `production`:

```bash
# Sau khi sửa code
git add .
git commit -m "Update feature X"
git push origin production

# Render tự động:
# 1. Phát hiện thay đổi
# 2. Pull code mới
# 3. Chạy build command
# 4. Redeploy
```

Theo dõi quá trình deploy trong Dashboard → Service → Events tab.

---

## 💰 Chi phí (Free Tier - 2025)

### Miễn phí:
- ✅ 750 giờ/tháng (đủ cho 1 service chạy 24/7)
- ✅ 100GB bandwidth/tháng
- ✅ PostgreSQL 1GB storage
- ✅ SSL/HTTPS miễn phí
- ✅ Auto-deploy từ GitHub

### Hạn chế Free Tier:
- ⚠️ Service ngủ sau 15 phút không hoạt động
- ⚠️ 512MB RAM, 0.1 CPU
- ⚠️ Database ngủ sau 90 ngày không hoạt động

### Paid Plans (nếu cần):
- **Starter:** $7/tháng - không sleep, 512MB RAM
- **Standard:** $25/tháng - 2GB RAM, horizontal scaling

---

## 🎯 Best Practices

1. **Environment Variables:**
   - Không bao giờ commit `.env` vào Git
   - Sử dụng Environment Groups cho nhiều services
   - Dùng secrets khác nhau cho development/production

2. **Database:**
   - Backup database thường xuyên
   - Sử dụng connection pooling
   - Monitor database performance

3. **Logging:**
   - Xem logs thường xuyên trong Render Dashboard
   - Setup error monitoring (Sentry, Rollbar)
   - Log quan trọng nhưng đừng log quá nhiều

4. **Security:**
   - Dùng HTTPS (Render cung cấp miễn phí)
   - Rotate JWT secret định kỳ
   - Rate limiting cho API endpoints
   - Validate input đầu vào

5. **Performance:**
   - Minify/compress assets
   - Sử dụng CDN cho static files
   - Enable gzip compression
   - Implement caching

---

## 📚 Tài liệu tham khảo

- [Render Documentation](https://render.com/docs)
- [Deploy Node.js App](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://docs.render.com/configure-environment-variables)
- [PostgreSQL on Render](https://render.com/docs/databases)

---

## ✅ Hoàn thành!

Chúc mừng! Bạn đã deploy thành công:
- ✅ Backend API
- ✅ Web Application  
- ✅ PostgreSQL Database
- ✅ Auto-deploy từ GitHub

Ứng dụng của bạn giờ đã live và có thể truy cập từ bất kỳ đâu! 🎉

---

**Cần hỗ trợ?** Tham gia [Render Community](https://community.render.com/) để được giúp đỡ.
