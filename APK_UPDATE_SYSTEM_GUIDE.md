# Hệ Thống Cập Nhật APK Tự Động

## 📋 Tổng Quan

Hệ thống cho phép admin upload phiên bản APK mới lên server và người dùng sẽ tự động nhận thông báo cập nhật khi mở app, sau đó APK sẽ được tải xuống và cài đặt tự động.

### ✨ Tính Năng

✅ **Trang quản lý APK cho admin** - Upload APK mới với version code và release notes  
✅ **Kiểm tra tự động** - App tự kiểm tra version mới khi khởi động  
✅ **Download tự động** - APK được tải xuống tự động với progress bar  
✅ **Install tự động** - Sau khi download xong, tự động mở màn hình cài đặt  
✅ **Force update** - Admin có thể bắt buộc người dùng cập nhật  
✅ **Offline support** - Hệ thống chỉ hoạt động khi có internet

---

## 🔧 Cấu Trúc Hệ Thống

### 1. Backend (Node.js + Express)

**Database Table**: `app_versions`
```sql
- id (serial)
- version_name (varchar) - VD: "1.0.1"
- version_code (integer) - VD: 2 (phải tăng dần)
- apk_url (text) - Đường dẫn file APK
- file_size (bigint) - Kích thước file
- release_notes (text) - Nội dung cập nhật
- is_force_update (boolean) - Bắt buộc cập nhật hay không
- uploaded_by (integer) - ID admin upload
- created_at (timestamp)
```

**API Endpoints**:
- `GET /api/app-versions/latest` - Lấy phiên bản mới nhất
- `GET /api/app-versions/check/:currentVersionCode` - Kiểm tra có update không
- `POST /api/app-versions/upload` - Upload APK mới (cần auth)
- `GET /api/app-versions/list` - Danh sách tất cả versions (cần auth)
- `DELETE /api/app-versions/:id` - Xóa version (cần auth)

**Static Files**:
- `/uploads/apk/*.apk` - Các file APK được upload
- `/apk-manager` - Trang admin quản lý APK

### 2. Mobile App (React Native + Expo)

**Components**:
- `UpdateChecker.js` - Kiểm tra version khi app khởi động
- `UpdateModal.js` - Hiển thị popup cập nhật với download/install

**Permissions** (app.json):
```json
{
  "android": {
    "versionCode": 1,
    "permissions": [
      "REQUEST_INSTALL_PACKAGES",
      "WRITE_EXTERNAL_STORAGE",
      "READ_EXTERNAL_STORAGE"
    ]
  }
}
```

---

## 📱 Cách Sử Dụng

### Bước 1: Truy Cập Trang Admin

1. Đăng nhập vào app với tài khoản admin
2. Lấy token từ localStorage (trong browser dev tools)
3. Truy cập: `http://your-backend.com/apk-manager`

### Bước 2: Upload APK Mới

1. **Tên phiên bản**: Nhập version name (VD: 1.0.1)
2. **Mã phiên bản**: Nhập version code (VD: 2) - **PHẢI LỚN HƠN VERSION TRƯỚC**
3. **Nội dung cập nhật**: Mô tả những gì thay đổi
4. **Bắt buộc cập nhật**: Tick nếu muốn user phải update
5. **Chọn file APK**: Chọn file .apk (tối đa 200MB)
6. Click "Upload APK"

### Bước 3: Người Dùng Nhận Cập Nhật

1. Người dùng mở app
2. App tự động kiểm tra version
3. Nếu có update:
   - Hiện popup thông báo
   - User click "Tải và Cập Nhật"
   - APK tự động download (hiện progress)
   - Sau khi download xong, tự động mở màn hình cài đặt
   - User click "Install"
4. App restart với version mới

---

## 🎯 Flow Hoạt Động

```
User mở app
   ↓
UpdateChecker kiểm tra version hiện tại (versionCode: 1)
   ↓
Gọi API: GET /api/app-versions/check/1
   ↓
Server check database → Có version mới (versionCode: 2)
   ↓
Server trả về thông tin update
   ↓
UpdateModal hiển thị popup
   ↓
User click "Tải và Cập Nhật"
   ↓
Download APK từ server (hiện progress 0-100%)
   ↓
Download xong → Lưu vào documentDirectory
   ↓
Tự động mở Intent để install APK
   ↓
Android hiện màn hình cài đặt
   ↓
User click "Install" → App cập nhật thành công!
```

---

## 🔐 Bảo Mật

1. **Authentication**: Chỉ admin có token mới upload được APK
2. **File Validation**: Chỉ accept file .apk
3. **Version Check**: Không cho upload version code trùng
4. **Database Constraints**: version_code và version_name phải unique

---

## 📊 Version Code Management

**Quan trọng**: Version Code phải tăng dần theo số nguyên

| Build | Version Name | Version Code | Ghi Chú |
|-------|--------------|--------------|---------|
| 1     | 1.0.0        | 1            | Version đầu tiên |
| 2     | 1.0.1        | 2            | Bug fixes |
| 3     | 1.1.0        | 3            | New features |
| 4     | 2.0.0        | 4            | Major update |

**Lưu ý**:
- Version Name có thể tùy ý (1.0.0, 1.0.1, v2.0, etc.)
- Version Code **PHẢI** là số nguyên tăng dần (1, 2, 3, 4...)
- Không được skip version code

---

## 🧪 Testing

### Test Backend API

```bash
# Kiểm tra version mới nhất
curl http://localhost:3000/api/app-versions/latest

# Kiểm tra có update không (giả sử current version code = 1)
curl http://localhost:3000/api/app-versions/check/1

# Upload APK (cần token)
curl -X POST http://localhost:3000/api/app-versions/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "version_name=1.0.1" \
  -F "version_code=2" \
  -F "release_notes=Bug fixes" \
  -F "is_force_update=false" \
  -F "apk=@path/to/your/app.apk"
```

### Test Mobile App

1. Build APK với versionCode: 1
2. Cài APK lên điện thoại
3. Upload APK mới với versionCode: 2 lên server
4. Mở app → Sẽ thấy popup cập nhật
5. Click "Tải và Cập Nhật" → APK download và install

---

## ⚙️ Config App

### Cập Nhật Version Code Mới

**File**: `mobile/app.json`

```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

**Quan trọng**: Mỗi lần build APK mới:
1. Tăng `versionCode` lên 1 (1 → 2 → 3 → 4...)
2. Có thể thay đổi `version` theo ý muốn (1.0.0 → 1.0.1)

### Build APK Mới

```bash
cd mobile
eas build --platform android --profile production
```

---

## 🎨 Customization

### Thay Đổi UI Update Modal

**File**: `mobile/src/components/UpdateModal.js`

Bạn có thể chỉnh:
- Màu sắc theme
- Icon và emoji
- Text và font size
- Button styles

### Thay Đổi Admin Page

**File**: `backend/public/apk-manager.html`

Chỉnh sửa HTML/CSS/JavaScript để custom giao diện admin.

---

## 🐛 Troubleshooting

### Lỗi "REQUEST_INSTALL_PACKAGES"

**Nguyên nhân**: Android 8.0+ cần permission đặc biệt  
**Giải pháp**: Đã thêm permission vào app.json, build lại APK

### APK Không Download Được

**Nguyên nhân**: Backend không serve static files  
**Giải pháp**: Check xem `/uploads` route đã được add vào server.js chưa

### Update Modal Không Hiện

**Nguyên nhân**: 
- Version code trong app.json chưa được set
- API URL không đúng
- Backend chưa chạy

**Giải pháp**: 
- Check app.json có `android.versionCode`
- Check Constants.expoConfig.extra.apiUrl
- Verify backend đang chạy

### Force Update Không Hoạt Động

**Nguyên nhân**: Button "Để sau" vẫn hiện  
**Giải pháp**: Check `updateInfo.isForceUpdate` trong UpdateModal

---

## 📝 Best Practices

1. **Luôn test trên device thật** - Emulator không support install APK tốt
2. **Backup APK files** - Lưu tất cả APK versions để rollback nếu cần
3. **Version code tuần tự** - Không skip numbers (1, 2, 3, 4...)
4. **Release notes rõ ràng** - Giúp user biết có gì mới
5. **Force update cẩn thận** - Chỉ dùng khi thực sự cần (security, critical bugs)
6. **Test kỹ trước khi upload** - APK lỗi sẽ làm app crash

---

## 🚀 Production Deployment

### Backend

1. Upload code lên Render.com
2. Set environment variables (DATABASE_URL, JWT_SECRET)
3. Tạo thư mục `/uploads/apk` trên server
4. Deploy

### Mobile

1. Update `apiUrl` trong app.json:
   ```json
   {
     "extra": {
       "apiUrl": "https://your-backend.onrender.com"
     }
   }
   ```

2. Build production APK:
   ```bash
   eas build --platform android --profile production
   ```

3. Upload APK đầu tiên lên server qua admin page

---

## 🎉 Kết Luận

Hệ thống APK update tự động đã sẵn sàng! 

**Next Steps**:
1. Build APK version 1 và cài lên điện thoại
2. Truy cập `/apk-manager` để upload version 2
3. Mở app → Test popup cập nhật
4. Enjoy! 🚀

**Lưu ý**: 
- Hệ thống chỉ hoạt động trên **Android** (iOS không cho phép install APK)
- User cần enable "Install from unknown sources" trên Android
- Backend cần đủ storage để lưu APK files (mỗi file ~50-100MB)
