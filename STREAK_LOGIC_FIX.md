# 🔥 Sửa Logic Streak - Yêu Cầu Cả 2 Người Nhắn Tin

## 🎯 Vấn Đề Cũ

**Logic trước đây:**
- Streak tăng khi **BẤT KỲ 1 người** nhắn tin
- Nếu chỉ User A nhắn tin đơn phương → Streak vẫn tăng ❌
- Điều này không đúng với cơ chế streak kiểu TikTok/Snapchat

**Ví dụ:**
- Ngày 1: User A nhắn tin cho User B → Streak = 1 ❌
- Ngày 2: User A lại nhắn tin (User B không trả lời) → Streak = 2 ❌
- Ngày 3: User A tiếp tục nhắn (User B vẫn không trả lời) → Streak = 3 ❌

## ✅ Logic Mới

**Yêu cầu: CẢ 2 NGƯỜI đều phải nhắn tin với nhau**

### Quy Tắc:

1. **Streak CHỈ tăng khi:**
   - Cả User A VÀ User B đều đã nhắn tin trong cùng ngày HOẶC
   - User A nhắn hôm qua, User B nhắn hôm nay (hoặc ngược lại)

2. **Streak KHÔNG tăng khi:**
   - Chỉ có 1 người nhắn tin
   - 1 người nhắn tin nhiều lần mà người kia không trả lời

### Ví Dụ Cụ Thể:

#### ✅ Trường Hợp Đúng:

**Cùng ngày:**
- Ngày 1, 10:00 AM: User A nhắn tin → Streak = 0 (đợi User B)
- Ngày 1, 2:00 PM: User B trả lời → Streak = 1 ✅

**Liên tục qua ngày:**
- Ngày 1: Cả 2 đều nhắn → Streak = 1
- Ngày 2: Cả 2 đều nhắn → Streak = 2 ✅
- Ngày 3: Cả 2 đều nhắn → Streak = 3 ✅

**Qua 2 ngày:**
- Ngày 1, 11:00 PM: User A nhắn tin → Streak = 0 (đợi User B)
- Ngày 2, 1:00 AM: User B trả lời → Streak = 1 ✅ (vì User A nhắn hôm qua, User B nhắn hôm nay)

#### ❌ Trường Hợp Sai:

**Chỉ 1 bên nhắn:**
- Ngày 1: User A nhắn tin → Streak = 0 (đợi User B)
- Ngày 2: User A nhắn lại (User B không trả lời) → Streak = 0 ❌
- Ngày 3: User A tiếp tục nhắn → Streak = 0 ❌

**Gián đoạn:**
- Ngày 1: Cả 2 nhắn → Streak = 1
- Ngày 2: Không ai nhắn → Streak vẫn = 1 (chưa broken)
- Ngày 3: User A nhắn → Streak = 0 (đợi User B)
- Ngày 4: User B nhắn → Streak = 1 (reset lại do bị broken ở ngày 2)

## 🔧 Thay Đổi Kỹ Thuật

### 1. Database Schema

**Thêm 2 columns mới vào bảng `message_streaks`:**

```sql
ALTER TABLE message_streaks 
ADD COLUMN user1_last_message_date DATE,
ADD COLUMN user2_last_message_date DATE;
```

**Ý nghĩa:**
- `user1_last_message_date`: Ngày user_id_1 nhắn tin lần cuối
- `user2_last_message_date`: Ngày user_id_2 nhắn tin lần cuối

### 2. Logic Mới (streakController.js)

**Khi User gửi tin:**

1. **Cập nhật ngày nhắn tin của sender:**
   - Nếu sender = user_id_1 → update `user1_last_message_date`
   - Nếu sender = user_id_2 → update `user2_last_message_date`

2. **Kiểm tra người kia đã nhắn chưa:**
   - Nếu chưa → Không tăng streak, chỉ lưu ngày nhắn tin
   - Nếu rồi → Kiểm tra điều kiện tăng streak

3. **Điều kiện tăng streak:**
   - **Cả 2 nhắn cùng ngày (today):**
     - Kiểm tra streak có bị broken không
     - Nếu liên tục từ hôm qua → Tăng +1
     - Nếu bị gián đoạn → Reset về 1
   
   - **Người này nhắn hôm qua, người kia nhắn hôm nay:**
     - Kiểm tra last_interaction_date
     - Nếu liên tục → Tăng +1
     - Nếu bị gián đoạn → Reset về 1

### 3. Console Logs

**Giờ bạn sẽ thấy logs chi tiết:**

```
[STREAK] Waiting for other user to message (user 123)
[STREAK] Started streak at 1 for users 100 and 123
[STREAK] Incremented streak to 2 for users 100 and 123
[STREAK] Sender already messaged today, no update needed
[STREAK] Waiting for other user (last messaged 3 days ago)
```

## 📊 Bảng So Sánh

| Tình Huống | Logic Cũ | Logic Mới |
|------------|----------|-----------|
| Chỉ User A nhắn 1 mình | Streak tăng ❌ | Streak = 0, đợi User B ✅ |
| Cả 2 nhắn cùng ngày | Streak tăng ✅ | Streak tăng ✅ |
| User A nhắn hôm qua, User B nhắn hôm nay | Streak tăng ✅ | Streak tăng ✅ |
| User A nhắn nhiều tin cùng ngày | Mỗi tin tăng streak ❌ | Chỉ count 1 lần ✅ |

## 🎮 Cách Test

### Test Case 1: Nhắn tin đơn phương
1. User A nhắn tin cho User B
2. Kiểm tra streak → Phải = 0
3. User A nhắn thêm nhiều tin
4. Kiểm tra streak → Vẫn = 0

### Test Case 2: Cả 2 nhắn cùng ngày
1. User A nhắn tin cho User B
2. Kiểm tra streak → = 0
3. User B trả lời
4. Kiểm tra streak → = 1 ✅

### Test Case 3: Streak liên tục
1. Ngày 1: Cả 2 nhắn → Streak = 1
2. Ngày 2: Cả 2 nhắn → Streak = 2
3. Ngày 3: Chỉ User A nhắn → Streak vẫn = 2 (đợi User B)
4. Ngày 4: User B nhắn → Streak broken, reset về 1

### Test Case 4: Qua ngày
1. Ngày 1, 11:50 PM: User A nhắn → Streak = 0
2. Ngày 2, 12:10 AM: User B trả lời → Streak = 1 ✅
3. Ngày 2, 11:50 PM: User A nhắn → Streak vẫn = 1
4. Ngày 3, 12:10 AM: User B trả lời → Streak = 2 ✅

## 📝 Lưu Ý

1. **User cũ cần làm gì?**
   - Không cần làm gì, streak hiện tại được giữ nguyên
   - Columns mới đã được set giá trị từ `last_interaction_date`

2. **Streak bị broken khi nào?**
   - Khi quá 1 ngày mà 1 trong 2 người không nhắn tin
   - Ví dụ: Ngày 1 cả 2 nhắn, Ngày 2 không ai nhắn, Ngày 3 chỉ có 1 người nhắn → Broken

3. **Có thể nhắn nhiều tin trong ngày?**
   - Có, nhưng chỉ count 1 lần cho streak
   - Tin thứ 2, 3, 4... trong cùng ngày không làm thay đổi streak

## ✅ Kết Luận

Logic mới đảm bảo:
- ✅ Streak chỉ tăng khi CẢ 2 người tương tác
- ✅ Không thể spam tin 1 chiều để tăng streak
- ✅ Đúng với cơ chế TikTok/Snapchat streak
- ✅ Công bằng cho cả 2 người
