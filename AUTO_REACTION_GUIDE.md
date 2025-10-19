# Hướng dẫn sử dụng hệ thống Auto Reaction

## Tổng quan

Hệ thống Auto Reaction tự động thả cảm xúc cho các bài viết mới một cách tự nhiên, giống như người dùng thật. Hệ thống sử dụng tài khoản ảo để tạo sự tương tác và tăng độ phổ biến cho các bài viết.

## Tính năng

✨ **Tự động thả cảm xúc:** Khi có bài viết mới, hệ thống sẽ tự động thả cảm xúc từ các tài khoản ảo

🎯 **Thả từ từ như người thật:** Cảm xúc được thả với khoảng thời gian ngẫu nhiên (5 giây - 3 phút) để giống người dùng thật

🚫 **Loại trừ cảm xúc phẫn nộ:** Hệ thống chỉ sử dụng các cảm xúc tích cực: like, love, haha, wow, sad (không có angry)

👥 **100 tài khoản ảo:** Hệ thống tạo và sử dụng 100 tài khoản ảo người Việt với tên, avatar và bio ngẫu nhiên

📊 **Số lượng cảm xúc thông minh:**
- 3-8 reactions: 20%
- 8-15 reactions: 35%
- 15-25 reactions: 25%
- 25-40 reactions: 15%
- 40-60 reactions: 5%

## Cài đặt

### Bước 1: Tạo tài khoản ảo

Chạy script để tạo 100 tài khoản ảo:

```bash
cd backend
node src/scripts/createFakeUsers.js
```

Hoặc tạo số lượng tùy chỉnh:

```bash
node src/scripts/createFakeUsers.js 50
```

**Thông tin tài khoản ảo:**
- Mật khẩu mặc định: `FakeUser123`
- Email format: `<username>@fake.com`
- Tên người Việt ngẫu nhiên
- Avatar từ pravatar.cc
- Bio ngẫu nhiên

### Bước 2: Khởi động server

Khi server khởi động, Auto Reaction Service sẽ tự động chạy:

```bash
npm start
```

Bạn sẽ thấy thông báo:

```
🤖 Đang khởi tạo Auto Reaction Service...
✅ Đã tải 100 tài khoản ảo
🚀 Auto Reaction Service đã khởi động
📊 Sẽ kiểm tra bài viết mới mỗi 10 giây
```

## API Endpoints

### 1. Kiểm tra trạng thái

```http
GET /api/auto-reactions/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "isRunning": true,
  "fakeUsersCount": 100,
  "processedPostsCount": 45,
  "checkInterval": 10000
}
```

### 2. Khởi động service

```http
POST /api/auto-reactions/start
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Auto Reaction Service started",
  "stats": {
    "isRunning": true,
    "fakeUsersCount": 100,
    "processedPostsCount": 0,
    "checkInterval": 10000
  }
}
```

### 3. Dừng service

```http
POST /api/auto-reactions/stop
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Auto Reaction Service stopped",
  "stats": {
    "isRunning": false,
    "fakeUsersCount": 100,
    "processedPostsCount": 45,
    "checkInterval": 10000
  }
}
```

## Cách hoạt động

1. **Phát hiện bài viết mới:**
   - Service kiểm tra database mỗi 10 giây
   - Tìm các bài viết được tạo trong vòng 5 phút gần đây
   - Chỉ xử lý bài viết từ người dùng thật (không phải tài khoản ảo)

2. **Chọn số lượng cảm xúc:**
   - Sử dụng thuật toán trọng số để chọn số lượng reactions hợp lý
   - Phần lớn bài viết sẽ có 8-15 reactions (35%)
   - Một số bài viết may mắn có thể có tới 40-60 reactions (5%)

3. **Chọn tài khoản ảo:**
   - Chọn ngẫu nhiên các tài khoản ảo
   - Mỗi tài khoản chỉ react 1 lần cho mỗi bài viết

4. **Lên lịch thả cảm xúc:**
   - Cảm xúc đầu tiên sau 5 giây
   - Cảm xúc cuối cùng sau tối đa 3 phút
   - Thời gian giữa các reactions được phân bổ đều với độ biến thiên ngẫu nhiên ±30%

5. **Chọn loại cảm xúc:**
   - Like: 40%
   - Love: 30%
   - Haha: 15%
   - Wow: 10%
   - Sad: 5%
   - Angry: 0% (bị loại trừ)

## Logs và Monitoring

Khi service hoạt động, bạn sẽ thấy các log:

```
📝 Phát hiện bài viết mới: ID 123
   ➡️ Sẽ thả 12 cảm xúc cho bài viết 123
   ✨ Đã thả cảm xúc like cho bài viết 123 từ user 45
   ✨ Đã thả cảm xúc love cho bài viết 123 từ user 67
   ...
```

## Lưu ý quan trọng

⚠️ **Không xóa tài khoản ảo:** Nếu bạn xóa các tài khoản có email @fake.com, service sẽ không hoạt động

⚠️ **Cache được xóa:** Mỗi lần thả reaction, cache newsfeed và userposts sẽ được xóa để đảm bảo dữ liệu cập nhật

⚠️ **Không gửi thông báo:** Service không tạo thông báo push cho người đăng bài để tránh spam

## Troubleshooting

### Service không khởi động

**Nguyên nhân:** Chưa có tài khoản ảo

**Giải pháp:**
```bash
cd backend
node src/scripts/createFakeUsers.js
```

### Không thấy reactions trên bài viết

**Kiểm tra:**
1. Service có đang chạy không? → Gọi `/api/auto-reactions/status`
2. Bài viết có mới không? (trong vòng 5 phút)
3. Bài viết có phải từ tài khoản ảo không? (Service bỏ qua bài viết từ @fake.com)

### Quá nhiều hoặc quá ít reactions

**Tùy chỉnh:** Chỉnh sửa file `backend/src/services/autoReactionService.js`

```javascript
// Điều chỉnh số lượng reactions
const ranges = [
  { min: 3, max: 8, weight: 20 },   // Thay đổi các giá trị này
  { min: 8, max: 15, weight: 35 },
  // ...
];
```

## Mở rộng trong tương lai

Có thể thêm các tính năng:
- ✅ Tự động comment
- ✅ Tự động share bài viết
- ✅ Tự động follow người dùng mới
- ✅ Lịch trình thả reactions theo giờ cao điểm
- ✅ Phân tích nội dung bài viết để chọn reaction phù hợp

## Hỗ trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Logs của server
2. Status của service qua API
3. Database có tài khoản @fake.com không
