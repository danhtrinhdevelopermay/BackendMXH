# Hướng Dẫn Sử Dụng Dynamic Theme (Giao Diện Động)

## 📋 Tổng Quan

Hệ thống **Dynamic Theme** cho phép ứng dụng của bạn tự động thay đổi giao diện dựa trên ngày trong năm mà **KHÔNG CẦN BUILD LẠI APK**. Người dùng sẽ thấy giao diện tự động cập nhật khi mở app.

### ✨ Tính Năng

✅ **Tự động thay đổi theme** - Giao diện tự động đổi sang theme ngày lễ vào ngày 20/10  
✅ **Không cần update APK** - Theme được fetch từ server, người dùng không cần cài bản mới  
✅ **Hoạt động offline** - Theme được cache locally, vẫn hoạt động khi mất mạng  
✅ **Tự động reset** - Sau ngày 21/10, giao diện tự động trở về bình thường  
✅ **Áp dụng cả web và mobile** - Cùng một hệ thống cho cả hai nền tảng

---

## 🎨 Theme Ngày 20/10 (Ngày Quốc Tế Phụ Nữ)

### Màu Sắc Theme Đặc Biệt

```javascript
{
  primary: '#ff1493',        // Deep pink
  primaryLight: '#ff69b4',   // Hot pink  
  primaryDark: '#c71585',    // Medium violet red
  secondary: '#ffb6c1',      // Light pink
  background: '#fff5f7',     // Very light pink background
  accent: '#ff1493',         // Deep pink
  // ... và nhiều màu khác
}
```

### Thông Báo Đặc Biệt

Khi vào ngày 20/10, app sẽ hiển thị:
- **Greeting**: "Chúc mừng 20/10! 🌸💐"
- **Message**: "Chúc tất cả phụ nữ luôn xinh đẹp, hạnh phúc và thành công!"

---

## 🔧 Cách Hoạt Động

### 1. Backend API

Backend có endpoint `/api/theme/config` tự động kiểm tra ngày hiện tại:

```javascript
// API sẽ trả về theme tương ứng
GET http://your-backend.com/api/theme/config

// Response khi KHÔNG phải ngày 20/10:
{
  "success": true,
  "theme": {
    "id": "default",
    "name": "Default Theme",
    "colors": { ... },
    "event": null
  }
}

// Response khi LÀ ngày 20/10:
{
  "success": true,
  "theme": {
    "id": "womens-day-2024",
    "name": "Ngày Quốc tế Phụ nữ 20/10",
    "colors": { ... },  // Màu hồng đặc biệt
    "event": {
      "name": "Ngày Quốc tế Phụ nữ",
      "greeting": "Chúc mừng 20/10! 🌸💐",
      "message": "..."
    }
  }
}
```

### 2. Mobile & Web App

Khi app khởi động:
1. **Fetch theme từ server** qua API
2. **Cache theme locally** (AsyncStorage cho mobile, localStorage cho web)
3. **Apply theme** cho toàn bộ app
4. **Refresh mỗi 30 phút** để cập nhật nếu có thay đổi

### 3. Offline Support

Nếu mất kết nối mạng:
- App sẽ dùng **theme đã cache** từ lần fetch trước
- Vẫn hiển thị theme chính xác dù không có internet

---

## 💻 Sử Dụng Theme Trong Code

### Trong Component Mobile/Web

```javascript
import { useTheme } from '../context/ThemeContext';

function MyComponent() {
  const { theme, getColor, isSpecialEvent } = useTheme();

  return (
    <View style={{ backgroundColor: getColor('background') }}>
      {isSpecialEvent() && (
        <Text style={{ color: getColor('primary') }}>
          {theme.event.greeting}
        </Text>
      )}
      
      <Text style={{ color: getColor('text') }}>
        Nội dung của bạn
      </Text>
    </View>
  );
}
```

### Các Hook Có Sẵn

```javascript
const {
  theme,           // Object chứa toàn bộ theme config
  isLoading,       // Boolean - đang load theme?
  error,           // String - lỗi nếu có
  getColor,        // Function - lấy màu theo key
  isSpecialEvent,  // Function - kiểm tra có phải sự kiện đặc biệt?
  refreshTheme,    // Function - refresh theme thủ công
} = useTheme();
```

### Component EventBanner (Đã Tạo Sẵn)

Component `EventBanner` tự động hiển thị thông báo khi là ngày lễ:

```javascript
import EventBanner from './components/EventBanner';

function HomeScreen() {
  return (
    <View>
      <EventBanner />  {/* Tự động hiện/ẩn theo ngày */}
      {/* Nội dung khác */}
    </View>
  );
}
```

---

## 🎯 Ví Dụ Áp Dụng Theme

### Example 1: Custom Button

```javascript
import { useTheme } from '../context/ThemeContext';

function CustomButton({ title, onPress }) {
  const { getColor } = useTheme();
  
  return (
    <TouchableOpacity 
      style={{
        backgroundColor: getColor('primary'),
        padding: 12,
        borderRadius: 8,
      }}
      onPress={onPress}
    >
      <Text style={{ color: getColor('headerText') }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
```

### Example 2: Header Component

```javascript
function AppHeader() {
  const { theme, getColor, isSpecialEvent } = useTheme();
  
  return (
    <View style={{ 
      backgroundColor: getColor('headerBackground'),
      padding: 16 
    }}>
      <Text style={{ color: getColor('headerText'), fontSize: 20 }}>
        {isSpecialEvent() ? theme.event.name : 'My App'}
      </Text>
    </View>
  );
}
```

---

## 🔄 Thêm Ngày Lễ Mới

Để thêm theme cho ngày lễ khác (VD: Tết, Giáng Sinh), chỉnh sửa file `backend/src/routes/theme.js`:

```javascript
const getThemeConfig = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Thêm điều kiện cho ngày lễ mới
  const isChristmas = month === 12 && day === 25;
  const isTet = month === 1 && day === 1;
  
  if (isWomensDay) {
    return womensDayTheme;
  } else if (isChristmas) {
    return christmasTheme;  // Tạo theme Giáng Sinh
  } else if (isTet) {
    return tetTheme;  // Tạo theme Tết
  }
  
  return defaultTheme;
};
```

---

## 🧪 Testing

### Test Thủ Công (Development)

1. **Kiểm tra ngày hiện tại:**
   ```bash
   curl http://localhost:3000/api/theme/current-date
   ```

2. **Xem theme hiện tại:**
   ```bash
   curl http://localhost:3000/api/theme/config
   ```

3. **Test theme ngày 20/10:**
   - Sửa code trong `theme.js` để force return `womensDayTheme`
   - Hoặc đổi ngày hệ thống thành 20/10

### Kiểm Tra Trên Mobile

1. Mở app trên thiết bị/emulator
2. Check console logs: `✨ Theme loaded: [Tên theme]`
3. Đóng app và mở lại - theme vẫn được load từ cache
4. Tắt internet, mở app - theme vẫn hoạt động

---

## 📱 Timeline Hoạt Động

```
19/10 11:59 PM  → Default Theme (màu tím chuẩn)
20/10 12:00 AM  → Women's Day Theme (màu hồng)
20/10 11:59 PM  → Vẫn là Women's Day Theme
21/10 12:00 AM  → Quay về Default Theme
```

App sẽ tự động refresh theme mỗi 30 phút, nên:
- Nếu user mở app lúc 11:30 PM ngày 19/10 → thấy default theme
- Sau 30 phút (12:00 AM ngày 20/10) → tự động đổi sang Women's Day theme

---

## 🎨 Customization Tips

### 1. Thay Đổi Màu Sắc Theme Ngày 20/10

Chỉnh sửa trong `backend/src/routes/theme.js`:

```javascript
const womensDayTheme = {
  // ...
  colors: {
    primary: '#YOUR_COLOR',      // Màu chính
    primaryLight: '#YOUR_COLOR',  // Màu sáng hơn
    // ...
  }
};
```

### 2. Thay Đổi Thông Điệp

```javascript
event: {
  greeting: 'Thông điệp của bạn! 🎉',
  message: 'Nội dung chi tiết...',
}
```

### 3. Thêm Hiệu Ứng (Future Enhancement)

```javascript
effects: {
  enableParticles: true,      // Bật hiệu ứng hoa rơi
  particleType: 'flowers',    // Loại particle
  particleColor: '#ff69b4',   // Màu của particle
}
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **Server phải online** - Để fetch theme lần đầu, server backend phải đang chạy
2. **Cache timeout** - Theme được refresh mỗi 30 phút, không phải real-time
3. **Múi giờ** - Backend sử dụng giờ server, cần đảm bảo timezone đúng
4. **Fallback** - Luôn có theme mặc định nếu server lỗi

---

## 🚀 Deploy Lên Production

Khi deploy:
1. ✅ Backend phải có DATABASE_URL
2. ✅ Mobile app config `apiUrl` trong `app.json`:
   ```json
   {
     "extra": {
       "apiUrl": "https://your-backend-production.com"
     }
   }
   ```
3. ✅ Web app set `REACT_APP_API_URL` environment variable

---

## 🎉 Hoàn Thành!

Bây giờ ứng dụng của bạn đã có khả năng tự động thay đổi giao diện cho ngày 20/10 mà không cần người dùng update APK!

**Ngày mai (20/10)**, tất cả người dùng sẽ thấy giao diện màu hồng đặc biệt khi mở app. 🌸💐
