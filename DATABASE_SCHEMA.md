# 📊 Cấu Hình Database - Shatter Social Media App

## 📌 Tổng Quan

Tài liệu này mô tả chi tiết cấu trúc database của ứng dụng mạng xã hội Shatter. Khi chuyển sang database mới hoặc thiết lập môi trường mới, bạn cần tạo tất cả các bảng và indexes được mô tả dưới đây.

**Database Engine:** PostgreSQL 12+  
**Encoding:** UTF-8

---

## 🗂️ Danh Sách Các Bảng

### 1. **users** - Thông tin người dùng
Lưu trữ thông tin tài khoản và hồ sơ người dùng.

| Cột | Kiểu dữ liệu | Mô tả | Ràng buộc |
|-----|--------------|-------|-----------|
| `id` | SERIAL | ID người dùng (khóa chính) | PRIMARY KEY |
| `username` | VARCHAR(50) | Tên đăng nhập | UNIQUE, NOT NULL |
| `email` | VARCHAR(100) | Email | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR(255) | Mật khẩu đã mã hóa | NOT NULL |
| `full_name` | VARCHAR(100) | Họ tên đầy đủ | - |
| `bio` | TEXT | Tiểu sử | - |
| `avatar_url` | TEXT | URL ảnh đại diện | - |
| `cover_url` | TEXT | URL ảnh bìa | - |
| `is_verified` | BOOLEAN | Đã xác thực | DEFAULT FALSE |
| `is_pro` | BOOLEAN | Tài khoản Pro | DEFAULT FALSE |
| `created_at` | TIMESTAMP | Thời gian tạo | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Thời gian cập nhật | DEFAULT CURRENT_TIMESTAMP |

**Indexes:**
- `idx_users_username` ON username
- `idx_users_email` ON email

---

### 2. **posts** - Bài viết
Lưu trữ các bài đăng của người dùng.

| Cột | Kiểu dữ liệu | Mô tả | Ràng buộc |
|-----|--------------|-------|-----------|
| `id` | SERIAL | ID bài viết | PRIMARY KEY |
| `user_id` | INTEGER | ID người đăng | FOREIGN KEY → users(id) ON DELETE CASCADE |
| `content` | TEXT | Nội dung bài viết | - |
| `media_url` | TEXT | URL ảnh/video | - |
| `media_type` | VARCHAR(50) | Loại media (image/jpeg, video/mp4,...) | - |
| `privacy` | VARCHAR(20) | Quyền riêng tư (public, friends) | DEFAULT 'public' |
| `created_at` | TIMESTAMP | Thời gian tạo | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Thời gian cập nhật | DEFAULT CURRENT_TIMESTAMP |

**Indexes:**
- `idx_posts_user_id` ON user_id
- `idx_posts_created_at` ON created_at DESC
- `idx_posts_user_created` ON (user_id, created_at DESC)

**Giá trị privacy hợp lệ:** `'public'`, `'friends'`

---

### 3. **comments** - Bình luận
Lưu trữ bình luận trên bài viết.

| Cột | Kiểu dữ liệu | Mô tả | Ràng buộc |
|-----|--------------|-------|-----------|
| `id` | SERIAL | ID bình luận | PRIMARY KEY |
| `post_id` | INTEGER | ID bài viết | FOREIGN KEY → posts(id) ON DELETE CASCADE |
| `user_id` | INTEGER | ID người bình luận | FOREIGN KEY → users(id) ON DELETE CASCADE |
| `content` | TEXT | Nội dung bình luận | NOT NULL |
| `created_at` | TIMESTAMP | Thời gian tạo | DEFAULT CURRENT_TIMESTAMP |

**Indexes:**
- `idx_comments_post_id` ON post_id
- `idx_comments_user_id` ON user_id

---

### 4. **reactions** - Cảm xúc (Like, Love, Haha,...)
Lưu trữ reactions của người dùng trên bài viết.

| Cột | Kiểu dữ liệu | Mô tả | Ràng buộc |
|-----|--------------|-------|-----------|
| `id` | SERIAL | ID reaction | PRIMARY KEY |
| `post_id` | INTEGER | ID bài viết | FOREIGN KEY → posts(id) ON DELETE CASCADE |
| `user_id` | INTEGER | ID người dùng | FOREIGN KEY → users(id) ON DELETE CASCADE |
| `reaction_type` | VARCHAR(20) | Loại reaction | NOT NULL |
| `created_at` | TIMESTAMP | Thời gian tạo | DEFAULT CURRENT_TIMESTAMP |
| - | - | Unique constraint | UNIQUE(post_id, user_id) |

**Indexes:**
- `idx_reactions_post_id` ON post_id
- `idx_reactions_user_post` ON (user_id, post_id)

**Giá trị reaction_type hợp lệ:** `'like'`, `'love'`, `'haha'`, `'wow'`, `'sad'`, `'angry'`

---

### 5. **friendships** - Quan hệ bạn bè
Quản lý kết bạn và lời mời kết bạn.

| Cột | Kiểu dữ liệu | Mô tả | Ràng buộc |
|-----|--------------|-------|-----------|
| `id` | SERIAL | ID quan hệ | PRIMARY KEY |
| `requester_id` | INTEGER | ID người gửi lời mời | FOREIGN KEY → users(id) ON DELETE CASCADE |
| `addressee_id` | INTEGER | ID người nhận lời mời | FOREIGN KEY → users(id) ON DELETE CASCADE |
| `status` | VARCHAR(20) | Trạng thái | DEFAULT 'pending' |
| `created_at` | TIMESTAMP | Thời gian tạo | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Thời gian cập nhật | DEFAULT CURRENT_TIMESTAMP |
| - | - | Unique constraint | UNIQUE(requester_id, addressee_id) |

**Indexes:**
- `idx_friendships_requester` ON requester_id
- `idx_friendships_addressee` ON addressee_id
- `idx_friendships_requester_status` ON (requester_id, status)
- `idx_friendships_addressee_status` ON (addressee_id, status)

**Giá trị status hợp lệ:** `'pending'`, `'accepted'`, `'rejected'`

---

### 6. **messages** - Tin nhắn
Lưu trữ tin nhắn riêng tư giữa người dùng.

| Cột | Kiểu dữ liệu | Mô tả | Ràng buộc |
|-----|--------------|-------|-----------|
| `id` | SERIAL | ID tin nhắn | PRIMARY KEY |
| `sender_id` | INTEGER | ID người gửi | FOREIGN KEY → users(id) ON DELETE CASCADE |
| `receiver_id` | INTEGER | ID người nhận | FOREIGN KEY → users(id) ON DELETE CASCADE |
| `content` | TEXT | Nội dung tin nhắn | NOT NULL |
| `is_read` | BOOLEAN | Đã đọc | DEFAULT FALSE |
| `created_at` | TIMESTAMP | Thời gian gửi | DEFAULT CURRENT_TIMESTAMP |

**Indexes:**
- `idx_messages_sender` ON sender_id
- `idx_messages_receiver` ON receiver_id
- `idx_messages_conversation` ON (sender_id, receiver_id, created_at DESC)
- `idx_messages_reverse_conversation` ON (receiver_id, sender_id, created_at DESC)

---

### 7. **notifications** - Thông báo
Lưu trữ thông báo cho người dùng.

| Cột | Kiểu dữ liệu | Mô tả | Ràng buộc |
|-----|--------------|-------|-----------|
| `id` | SERIAL | ID thông báo | PRIMARY KEY |
| `user_id` | INTEGER | ID người nhận | FOREIGN KEY → users(id) ON DELETE CASCADE |
| `type` | VARCHAR(50) | Loại thông báo | NOT NULL |
| `content` | TEXT | Nội dung | NOT NULL |
| `related_user_id` | INTEGER | ID người dùng liên quan | - |
| `related_post_id` | INTEGER | ID bài viết liên quan | - |
| `is_read` | BOOLEAN | Đã đọc | DEFAULT FALSE |
| `created_at` | TIMESTAMP | Thời gian tạo | DEFAULT CURRENT_TIMESTAMP |

**Indexes:**
- `idx_notifications_user_id` ON user_id
- `idx_notifications_user_read` ON (user_id, is_read, created_at DESC)

**Giá trị type hợp lệ:** `'friend_request'`, `'friend_accept'`, `'comment'`, `'reaction'`, `'mention'`

---

### 8. **stories** - Stories (24h)
Lưu trữ stories của người dùng (tự động xóa sau 24h).

| Cột | Kiểu dữ liệu | Mô tả | Ràng buộc |
|-----|--------------|-------|-----------|
| `id` | SERIAL | ID story | PRIMARY KEY |
| `user_id` | INTEGER | ID người đăng | FOREIGN KEY → users(id) ON DELETE CASCADE |
| `media_url` | TEXT | URL ảnh/video | NOT NULL |
| `media_type` | VARCHAR(50) | Loại media | NOT NULL |
| `caption` | TEXT | Chú thích | - |
| `created_at` | TIMESTAMP | Thời gian tạo | DEFAULT CURRENT_TIMESTAMP |
| `expires_at` | TIMESTAMP | Thời gian hết hạn | DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours' |

**Indexes:**
- `idx_stories_user_id` ON user_id
- `idx_stories_expires_at` ON expires_at

**Lưu ý:** Stories tự động hết hạn sau 24 giờ. Cần có cronjob để xóa stories đã hết hạn.

---

### 9. **user_thoughts** - Suy nghĩ/Trạng thái
Lưu trữ suy nghĩ ngắn của người dùng (giống status update).

| Cột | Kiểu dữ liệu | Mô tả | Ràng buộc |
|-----|--------------|-------|-----------|
| `id` | SERIAL | ID thought | PRIMARY KEY |
| `user_id` | INTEGER | ID người dùng | FOREIGN KEY → users(id) ON DELETE CASCADE, UNIQUE |
| `content` | VARCHAR(100) | Nội dung suy nghĩ | NOT NULL |
| `emoji` | VARCHAR(10) | Emoji đại diện | - |
| `created_at` | TIMESTAMP | Thời gian tạo | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Thời gian cập nhật | DEFAULT CURRENT_TIMESTAMP |

**Indexes:**
- `idx_user_thoughts_user_id` ON user_id
- `idx_user_thoughts_updated_at` ON updated_at DESC

**Lưu ý:** Mỗi user chỉ có 1 thought (UNIQUE constraint trên user_id)

---

### 10. **push_tokens** - Push Notification Tokens
Lưu trữ device tokens cho push notifications.

| Cột | Kiểu dữ liệu | Mô tả | Ràng buộc |
|-----|--------------|-------|-----------|
| `id` | SERIAL | ID token | PRIMARY KEY |
| `user_id` | INTEGER | ID người dùng | FOREIGN KEY → users(id) ON DELETE CASCADE |
| `push_token` | TEXT | Device token | NOT NULL |
| `device_type` | VARCHAR(50) | Loại thiết bị (ios, android) | - |
| `created_at` | TIMESTAMP | Thời gian tạo | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Thời gian cập nhật | DEFAULT CURRENT_TIMESTAMP |
| - | - | Unique constraint | UNIQUE(user_id, push_token) |

**Indexes:**
- `idx_push_tokens_user_id` ON user_id

---

## 🔗 Quan Hệ Giữa Các Bảng

```
users (1) ──→ (N) posts
users (1) ──→ (N) comments
users (1) ──→ (N) reactions
users (1) ──→ (N) friendships (as requester)
users (1) ──→ (N) friendships (as addressee)
users (1) ──→ (N) messages (as sender)
users (1) ──→ (N) messages (as receiver)
users (1) ──→ (N) notifications
users (1) ──→ (N) stories
users (1) ──→ (1) user_thoughts
users (1) ──→ (N) push_tokens

posts (1) ──→ (N) comments
posts (1) ──→ (N) reactions
```

---

## 📋 Script Tạo Database Hoàn Chỉnh

### Bước 1: Tạo Tables

```sql
-- 1. Tạo bảng users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tạo bảng posts
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type VARCHAR(50),
  privacy VARCHAR(20) DEFAULT 'public',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tạo bảng comments
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tạo bảng reactions
CREATE TABLE IF NOT EXISTS reactions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- 5. Tạo bảng friendships
CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  addressee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(requester_id, addressee_id)
);

-- 6. Tạo bảng messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tạo bảng notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  related_user_id INTEGER,
  related_post_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tạo bảng stories
CREATE TABLE IF NOT EXISTS stories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(50) NOT NULL,
  caption TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours'
);

-- 9. Tạo bảng user_thoughts
CREATE TABLE IF NOT EXISTS user_thoughts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content VARCHAR(100) NOT NULL,
  emoji VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- 10. Tạo bảng push_tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  device_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, push_token)
);
```

### Bước 2: Tạo Indexes

```sql
-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_thoughts_user_id ON user_thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_thoughts_updated_at ON user_thoughts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

-- Compound indexes để tối ưu queries phức tạp
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_user_post ON reactions(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_friendships_requester_status ON friendships(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee_status ON friendships(addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reverse_conversation ON messages(receiver_id, sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
```

---

## ⚙️ Cấu Hình Bắt Buộc

### 1. Environment Variables

Khi thiết lập database mới, cần cấu hình các biến môi trường sau:

```bash
# Database Connection
DATABASE_URL=postgresql://username:password@host:port/database_name

# Hoặc cấu hình riêng lẻ
PGHOST=your-host
PGPORT=5432
PGUSER=your-username
PGPASSWORD=your-password
PGDATABASE=your-database-name
```

### 2. Cloudinary (Lưu trữ media)

App sử dụng Cloudinary để lưu trữ ảnh/video:

```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Cronjob để Xóa Stories Hết Hạn

Tạo cronjob để tự động xóa stories đã hết hạn:

```sql
-- Chạy mỗi giờ
DELETE FROM stories WHERE expires_at < NOW();
```

Hoặc sử dụng scheduled job trong backend:

```javascript
// Run every hour
setInterval(async () => {
  await pool.query('DELETE FROM stories WHERE expires_at < NOW()');
}, 3600000);
```

---

## 🔄 Migration Guide

### Từ Database Cũ sang Database Mới

1. **Backup dữ liệu cũ:**
```bash
pg_dump -h old-host -U old-user -d old-database > backup.sql
```

2. **Tạo tables và indexes mới** (sử dụng scripts ở trên)

3. **Import dữ liệu:**
```bash
psql -h new-host -U new-user -d new-database < backup.sql
```

4. **Verify data:**
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM posts;
-- ... kiểm tra các bảng khác
```

5. **Cập nhật DATABASE_URL** trong environment variables

---

## 📝 Lưu Ý Quan Trọng

### ✅ Bắt Buộc
- PostgreSQL version 12 trở lên
- Tất cả bảng phải có `ON DELETE CASCADE` cho foreign keys
- Stories phải có expires_at để tự động xóa
- Messages cần index conversation để tối ưu chat

### ⚠️ Cảnh Báo
- Không xóa index khi database có nhiều dữ liệu (sẽ chậm)
- Backup trước khi migration
- Test kỹ trên database development trước khi áp dụng lên production

### 🚀 Tối Ưu Performance
- Indexes đã được tối ưu cho các query thường dùng
- Sử dụng connection pooling (pg-pool)
- Enable query caching cho posts/stories

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề khi thiết lập database:
1. Kiểm tra version PostgreSQL (phải >= 12)
2. Verify connection string trong DATABASE_URL
3. Chạy lại scripts tạo tables và indexes
4. Kiểm tra logs của database server

---

**Version:** 1.0  
## 🌟 Tính Năng Pro

### Tài khoản Pro (`is_pro` = TRUE)
Người dùng có tài khoản Pro sẽ có giao diện trang hồ sơ đặc biệt:
- **Cover Photo**: Gradient động với màu sắc hiện đại (nếu không có ảnh bìa)
- **Avatar**: Border gradient đẹp mắt
- **Stats Cards**: Cards với gradient backgrounds thay vì inline stats
- **Màu sắc**: Gradient từ purple, pink đến blue
- **Trải nghiệm**: Giao diện sống động, hiện đại

### Tài khoản Thường (`is_pro` = FALSE)
- Giao diện mặc định, kiểu Twitter
- Cover photo đơn giản
- Avatar thường
- Stats inline đơn giản

---

**Last Updated:** 2025-10-17  
**Compatible With:** Shatter Social Media App v1.0+
