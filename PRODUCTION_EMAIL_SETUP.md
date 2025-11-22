# Hướng dẫn nâng cấp Email Service lên Production

## 🚨 Vấn đề hiện tại

Hiện tại ứng dụng đang sử dụng **Resend Test Mode** với những hạn chế sau:
- ✉️ Email chỉ được gửi đến địa chỉ đã được xác thực trên tài khoản Resend
- 🔒 Người dùng khác sẽ không nhận được email OTP
- ⚠️ Test API key đã bị lộ và cần được thay thế

## 🎯 Giải pháp: Nâng cấp lên Production Mode

Để gửi email OTP cho tất cả người dùng, bạn cần:
1. Xác thực domain của bạn với Resend
2. Lấy Production API key mới
3. Cấu hình ứng dụng với thông tin production

---

## 📋 Bước 1: Xác thực Domain với Resend

### 1.1. Đăng nhập vào Resend
Truy cập: https://resend.com/login

### 1.2. Thêm domain
1. Vào trang **Domains**: https://resend.com/domains
2. Nhấn **Add Domain**
3. Nhập tên domain của bạn (ví dụ: `yourdomain.com`)
4. Nhấn **Add**

### 1.3. Cấu hình DNS Records
Resend sẽ cung cấp các DNS records cần thêm vào domain của bạn:

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Record:**
```
Type: TXT
Name: resend._domainkey
Value: [Resend sẽ cung cấp giá trị cụ thể]
```

**DMARC Record (tùy chọn nhưng nên có):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:your-email@yourdomain.com
```

### 1.4. Thêm DNS Records
- Đăng nhập vào nhà cung cấp domain của bạn (GoDaddy, Namecheap, Cloudflare, etc.)
- Vào phần **DNS Management** hoặc **DNS Settings**
- Thêm các records như Resend yêu cầu
- Lưu thay đổi

### 1.5. Xác minh Domain
- Quay lại Resend Domains page
- Nhấn **Verify** bên cạnh domain của bạn
- Chờ 1-48 giờ để DNS records được cập nhật (thường chỉ vài phút)
- Khi thành công, domain sẽ có trạng thái **Verified** ✅

---

## 📋 Bước 2: Lấy Production API Key

### 2.1. Tạo Production API Key mới
1. Vào trang **API Keys**: https://resend.com/api-keys
2. Nhấn **Create API Key**
3. Đặt tên: `Shatter Production`
4. Chọn permission: **Full Access** hoặc **Sending Access**
5. Nhấn **Create**
6. **Sao chép API key ngay lập tức** (bạn sẽ không thấy lại được!)

### 2.2. Xóa Test API Key cũ (bảo mật)
1. Tìm API key cũ có prefix `re_PML8CD4G...` (đã bị lộ)
2. Nhấn **Delete** để vô hiệu hóa key cũ
3. Điều này bảo vệ tài khoản của bạn khỏi bị lạm dụng

---

## 📋 Bước 3: Cấu hình ứng dụng với Production Settings

### 3.1. Cập nhật RESEND_API_KEY Secret
1. Mở Replit project
2. Vào **Secrets** tab (biểu tượng khóa 🔒 ở sidebar)
3. Tìm secret `RESEND_API_KEY`
4. Nhấn **Edit** và paste Production API key mới vào
5. Nhấn **Save**

### 3.2. Thêm Environment Variables cho Production
Vào **Secrets** tab và thêm 2 secrets mới:

**FROM_EMAIL:**
```
Giá trị: noreply@yourdomain.com
```
(Thay `yourdomain.com` bằng domain đã xác thực)

**FROM_NAME:**
```
Giá trị: Shatter
```
(Hoặc tên khác bạn muốn hiển thị cho người nhận)

### 3.3. Restart Backend Server
Sau khi cập nhật secrets:
1. Vào **Workflows** tab
2. Nhấn **Restart** cho workflow **Backend Server**
3. Kiểm tra logs, bạn sẽ thấy:
   ```
   ✅ Email service running in PRODUCTION MODE - sending from: Shatter <noreply@yourdomain.com>
   ```

---

## 📋 Bước 4: Kiểm tra Production Setup

### 4.1. Test gửi OTP
1. Mở ứng dụng mobile
2. Vào **Profile** → **Settings** → **Change Password**
3. Nhấn **Send OTP**
4. Kiểm tra email của bạn

**Nếu thành công:**
- ✅ Email OTP đến inbox (hoặc spam folder)
- ✅ Không có test mode warning box
- ✅ Response không có `testMode: true`

**Nếu vẫn thấy test mode:**
- ❌ Kiểm tra lại FROM_EMAIL secret
- ❌ Đảm bảo domain đã verified
- ❌ Restart lại backend server

### 4.2. Test với người dùng thật
1. Tạo tài khoản mới với email khác
2. Cập nhật email trong profile
3. Thử đổi mật khẩu
4. Kiểm tra email đến inbox

---

## 🔧 Troubleshooting

### Email không đến
**Kiểm tra:**
1. ✉️ Domain đã được verified chưa?
2. 🔑 FROM_EMAIL có đúng format `something@verified-domain.com`?
3. 📧 Kiểm tra spam/junk folder
4. 📊 Xem Resend logs: https://resend.com/logs

### Vẫn thấy test mode
**Giải pháp:**
```bash
# Kiểm tra environment variables
echo $FROM_EMAIL
echo $FROM_NAME

# Nếu không có giá trị, thêm vào Secrets tab
# Sau đó restart backend
```

### Email vào spam folder
**Cải thiện deliverability:**
1. ✅ Đảm bảo đã thêm SPF, DKIM, DMARC records
2. 📝 Sử dụng domain thật, không dùng subdomain
3. 🎨 Email template chuyên nghiệp (đã có sẵn)
4. 🚫 Tránh từ ngữ spam như "URGENT", "FREE", "WINNER"
5. 🔒 Chỉ gửi email cho người đã đăng ký

### API key bị lộ
**Hành động ngay:**
1. 🔑 Xóa API key cũ trên Resend
2. 🆕 Tạo Production API key mới
3. 🔒 Cập nhật secret RESEND_API_KEY
4. ♻️ Restart backend server

---

## 💰 Chi phí Resend

### Free Plan
- ✅ 100 emails/ngày
- ✅ 1 domain verified
- ✅ Đủ cho testing và ứng dụng nhỏ

### Pro Plan ($20/tháng)
- ✅ 50,000 emails/tháng
- ✅ Multiple domains
- ✅ Email analytics
- ✅ Priority support

**Lời khuyên:** Bắt đầu với Free Plan, nâng cấp khi cần thiết.

---

## 📚 Tài liệu tham khảo

- 📖 Resend Documentation: https://resend.com/docs
- 🌐 Domain Verification: https://resend.com/docs/dashboard/domains/introduction
- 🔑 API Keys Guide: https://resend.com/docs/dashboard/api-keys/introduction
- 📧 Email Best Practices: https://resend.com/docs/knowledge-base/best-practices

---

## 🎉 Kết quả

Sau khi hoàn thành tất cả các bước:
- ✅ Gửi email OTP cho **tất cả người dùng**, không giới hạn
- ✅ Email từ **domain chính thức** của bạn
- ✅ Tăng **độ tin cậy** và **deliverability**
- ✅ Bảo mật **API key** trong Secrets
- ✅ Sẵn sàng cho **production deployment**

---

## ❓ Cần hỗ trợ?

Nếu gặp vấn đề trong quá trình setup:
1. 🔍 Kiểm tra Resend logs: https://resend.com/logs
2. 📧 Contact Resend Support: https://resend.com/support
3. 📚 Đọc Resend Docs: https://resend.com/docs
4. 🤝 Hỏi trong Resend Community: https://resend.com/discord

---

**Lưu ý:** Hướng dẫn này được viết vào ngày 22/11/2025. Giao diện Resend có thể thay đổi theo thời gian, nhưng quy trình chung vẫn tương tự.
