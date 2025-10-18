# Shatter Web App

Phiên bản web của ứng dụng mạng xã hội Shatter, được xây dựng với HTML, CSS, và JavaScript thuần.

## Tính năng

### ✅ Đã triển khai đầy đủ

- **Xác thực người dùng**
  - Đăng nhập
  - Đăng ký tài khoản mới
  - Quản lý phiên đăng nhập với JWT token

- **News Feed / Trang chủ**
  - Xem bài viết từ bạn bè
  - Tạo bài viết mới (text, ảnh, video)
  - Thích/Unlike bài viết
  - Bình luận bài viết
  - Xóa bài viết của bản thân

- **Bạn bè**
  - Xem danh sách bạn bè
  - Xem lời mời kết bạn
  - Chấp nhận/Từ chối lời mời kết bạn
  - Tìm kiếm người dùng
  - Gửi lời mời kết bạn
  - Hủy kết bạn

- **Tin nhắn**
  - Xem danh sách cuộc trò chuyện
  - Gửi tin nhắn trực tiếp 1-1
  - Xem lịch sử tin nhắn
  - Cập nhật tin nhắn real-time (polling mỗi 3 giây)

- **Thông báo**
  - Xem thông báo về lời mời kết bạn
  - Xem thông báo về bình luận
  - Xem thông báo về reactions
  - Đánh dấu đã đọc thông báo

- **Trang cá nhân**
  - Xem thông tin cá nhân
  - Chỉnh sửa thông tin (tên, tiểu sử)
  - Cập nhật ảnh đại diện
  - Cập nhật ảnh bìa
  - Xem bài viết của bản thân

## Công nghệ sử dụng

- **HTML5** - Cấu trúc trang
- **CSS3** - Giao diện Material Design với gradient xanh-tím đặc trưng
- **JavaScript (Vanilla)** - Logic ứng dụng
- **Font Awesome** - Icons
- **Backend API** - Node.js/Express (chia sẻ với mobile app)

## Cách sử dụng

### Chạy ứng dụng

Web app được serve trực tiếp từ backend server:

```bash
cd backend
node server.js
```

Server sẽ chạy tại `http://localhost:5000` và tự động serve cả:
- Web app (static files từ thư mục `/web`)
- Backend API (endpoints `/api/*`)

### Truy cập ứng dụng

Mở trình duyệt và truy cập: `http://localhost:5000`

## Cấu trúc thư mục

```
web/
├── index.html          # Trang HTML chính
├── css/
│   └── styles.css     # CSS cho toàn bộ ứng dụng
├── js/
│   ├── api.js         # Kết nối API và các request
│   ├── auth.js        # Xử lý đăng nhập/đăng ký
│   ├── posts.js       # Xử lý bài viết và comments
│   ├── friends.js     # Xử lý bạn bè
│   ├── messages.js    # Xử lý tin nhắn
│   ├── notifications.js # Xử lý thông báo
│   ├── profile.js     # Xử lý trang cá nhân
│   └── app.js         # Main app logic và navigation
└── assets/            # Hình ảnh và tài nguyên tĩnh
```

## Giao diện

- **Gradient xanh-tím đặc trưng** (#667eea → #764ba2)
- **Material Design** principles
- **Responsive design** - Tối ưu cho desktop và tablet
- **Smooth animations** - Transitions mượt mà
- **Modern UI components** - Cards, modals, toasts

## Tính năng đặc biệt

### Toast Notifications
Thông báo popup hiển thị kết quả các hành động (success, error, info)

### Modal Dialogs
Giao diện modal cho các chức năng như tạo bài viết, chỉnh sửa profile

### Real-time Updates
- Polling cho tin nhắn mới (3 giây)
- Polling cho thông báo (30 giây)

### Local Storage
- Lưu trữ JWT token
- Lưu trữ user ID và username
- Duy trì phiên đăng nhập

## API Integration

Web app kết nối với các API endpoints:

- `/api/auth/*` - Xác thực
- `/api/posts/*` - Bài viết
- `/api/comments/*` - Bình luận
- `/api/reactions/*` - Reactions
- `/api/friendships/*` - Kết bạn
- `/api/messages/*` - Tin nhắn
- `/api/notifications/*` - Thông báo
- `/api/users/*` - Người dùng

## Bảo mật

- JWT token authentication
- Secure token storage trong localStorage
- Request authentication headers
- Input validation
- XSS prevention với escapeHtml()

## Tương lai

Các tính năng có thể bổ sung:

- [ ] WebSocket cho real-time messaging
- [ ] Stories 24h
- [ ] Thoughts/Status updates
- [ ] Video/Voice calls
- [ ] Message reactions
- [ ] Progressive Web App (PWA)
- [ ] Dark mode
- [ ] Multi-language support

## Tác giả

Được xây dựng với ❤️ cho dự án Shatter - Social Media Platform
