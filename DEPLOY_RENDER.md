# Hướng Dẫn Deploy Backend Lên Render

## Bước 1: Chuẩn Bị Database PostgreSQL

### Option A: Sử dụng Render PostgreSQL (Khuyến nghị)
1. Truy cập [Render Dashboard](https://dashboard.render.com/)
2. Đăng nhập hoặc tạo tài khoản mới (miễn phí)
3. Click "New +" → Chọn "PostgreSQL"
4. Điền thông tin:
   - **Name**: `social-media-db`
   - **Database**: `socialmedia`
   - **User**: tự động tạo
   - **Region**: Singapore (gần Việt Nam nhất)
   - **Plan**: Free
5. Click "Create Database"
6. Đợi database khởi tạo (khoảng 1-2 phút)
7. Copy **Internal Database URL** (bắt đầu bằng `postgres://...`)

### Option B: Sử dụng database khác (Neon, Supabase, v.v.)
- Lấy connection string PostgreSQL từ provider bạn chọn

## Bước 2: Deploy Backend Lên Render

1. Vào [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → Chọn "Web Service"
3. Kết nối với repository GitHub của bạn:
   - Nếu chưa có: Push code lên GitHub trước
   - Click "Connect Repository" và chọn repo của bạn

4. Cấu hình Web Service:
   - **Name**: `social-media-backend`
   - **Region**: Singapore
   - **Branch**: main (hoặc branch chính của bạn)
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

5. Thêm Environment Variables:
   Click "Advanced" → "Add Environment Variable":
   
   ```
   DATABASE_URL = [paste Internal Database URL từ bước 1]
   JWT_SECRET = [tạo một chuỗi ngẫu nhiên dài, ví dụ: my-super-secret-jwt-key-2024]
   NODE_ENV = production
   PORT = 5000
   ```

6. Click "Create Web Service"
7. Đợi deploy hoàn tất (5-10 phút)
8. Copy URL của backend (dạng: `https://social-media-backend.onrender.com`)

## Bước 3: Khởi Tạo Database Schema

1. Sau khi backend deploy xong, bạn cần chạy SQL để tạo tables
2. Vào Render Dashboard → Click vào database → Tab "psql"
3. Copy và chạy các câu lệnh SQL sau:

```sql
-- Tạo bảng users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng posts
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  media_data BYTEA,
  media_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng comments
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng reactions
CREATE TABLE IF NOT EXISTS reactions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- Tạo bảng friendships
CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  addressee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(requester_id, addressee_id)
);

-- Tạo bảng messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  reference_id INTEGER,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Bước 4: Cập Nhật URL Backend Trong Mobile App

1. Mở file `mobile/app.json`
2. Tìm dòng `"apiUrl":`
3. Thay thế bằng URL Render của bạn:

```json
"extra": {
  "apiUrl": "https://social-media-backend.onrender.com",
  ...
}
```

4. Save file và restart Expo:
   - Stop workflow Expo Mobile
   - Start lại workflow

## Bước 5: Test Ứng Dụng

1. Mở Expo Go trên điện thoại
2. Scan QR code từ Expo
3. Thử đăng ký tài khoản mới
4. Thử đăng bài viết có video

## Lưu Ý Quan Trọng

### Free Tier Render
- Backend sẽ "ngủ" sau 15 phút không hoạt động
- Khi có request mới, mất 30-60 giây để "thức dậy"
- Giới hạn 750 giờ/tháng (đủ dùng cho development)

### Nâng Cấp (Nếu Cần)
- Render Starter ($7/tháng): Không bị ngủ, tốc độ nhanh hơn
- Database Starter ($7/tháng): Nhiều storage hơn

### Monitoring
- Xem logs tại: Render Dashboard → Your Service → Logs
- Xem database tại: Render Dashboard → Your Database → Connections

## Troubleshooting

### Lỗi "Cannot connect to database"
- Kiểm tra DATABASE_URL đã đúng chưa
- Đảm bảo database đã được tạo thành công

### Lỗi "Service unavailable" 
- Đợi 1-2 phút cho backend "thức dậy"
- Kiểm tra logs để xem lỗi cụ thể

### App vẫn loading
- Force close và mở lại Expo Go
- Kiểm tra URL backend trong app.json đã đúng
- Test backend URL trực tiếp trên browser
