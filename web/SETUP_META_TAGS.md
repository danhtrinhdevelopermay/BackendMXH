# Hướng dẫn Cấu hình Meta Tags và OG Image

## ✅ Đã hoàn thành

File `web/public/index.html` đã được cập nhật với đầy đủ meta tags cho:
- SEO (Search Engine Optimization)
- Open Graph (Facebook, LinkedIn, v.v.)
- Twitter Cards
- PWA (Progressive Web App)

## 📁 Files được tạo/cập nhật

### 1. `web/public/index.html`
Chứa tất cả meta tags:
- Title, description, keywords
- Open Graph tags (og:title, og:description, og:image)
- Twitter Card tags
- Theme color, mobile app settings
- Language: Tiếng Việt (vi)

### 2. `web/public/og-image.png`
- Ảnh OG image cho social sharing
- Kích thước: 1200x630px (chuẩn Facebook/LinkedIn)
- Hiển thị logo và slogan "Shatter - Chủ Sở Hữu Danh Tính"

### 3. `web/public/manifest.json`
- PWA manifest cho Progressive Web App
- Cho phép người dùng cài đặt web app như ứng dụng native
- Cấu hình icons, theme color, display mode

### 4. `web/public/robots.txt`
- File cho SEO crawler
- Cho phép tất cả bots truy cập
- Link đến sitemap

### 5. `web/app.json`
- Cập nhật description và web config
- Theme color: #6200ee (tím)

## 🔧 Cấu hình khi Deploy

### ⚠️ QUAN TRỌNG: Cập nhật URL

Khi deploy lên Render, bạn cần cập nhật URL trong các file sau:

#### File: `web/public/index.html` (dòng 22-24, 33-36)

**Hiện tại:**
```html
<meta property="og:url" content="https://shatter-web.onrender.com/" />
<meta property="og:image" content="https://shatter-web.onrender.com/og-image.png" />
<meta property="twitter:url" content="https://shatter-web.onrender.com/" />
<meta property="twitter:image" content="https://shatter-web.onrender.com/og-image.png" />
```

**Thay đổi thành URL thực tế của bạn:**
```html
<meta property="og:url" content="https://your-app-name.onrender.com/" />
<meta property="og:image" content="https://your-app-name.onrender.com/og-image.png" />
<meta property="twitter:url" content="https://your-app-name.onrender.com/" />
<meta property="twitter:image" content="https://your-app-name.onrender.com/og-image.png" />
```

#### File: `web/public/robots.txt` (dòng 3)

**Hiện tại:**
```
Sitemap: https://shatter-web.onrender.com/sitemap.xml
```

**Thay đổi thành:**
```
Sitemap: https://your-app-name.onrender.com/sitemap.xml
```

## 🧪 Kiểm tra Meta Tags

### 1. Kiểm tra trên Facebook
- Truy cập: https://developers.facebook.com/tools/debug/
- Nhập URL của bạn
- Click "Debug" để xem preview

### 2. Kiểm tra trên Twitter
- Truy cập: https://cards-dev.twitter.com/validator
- Nhập URL của bạn
- Xem preview Twitter Card

### 3. Kiểm tra trên LinkedIn
- Truy cập: https://www.linkedin.com/post-inspector/
- Nhập URL của bạn
- Xem preview

### 4. Kiểm tra PWA
- Mở ứng dụng trên Chrome/Edge
- Nhấn vào menu (3 chấm)
- Chọn "Install Shatter" hoặc "Add to Home Screen"

## 📱 Các tính năng PWA

Khi cài đặt web app, người dùng sẽ có:
- ✅ Icon trên màn hình chính
- ✅ Chạy fullscreen (không có thanh địa chỉ)
- ✅ Splash screen khi mở
- ✅ Hoạt động như app native

## 🎨 Tùy chỉnh

### Thay đổi Theme Color
File: `web/public/index.html` (dòng 38)
```html
<meta name="theme-color" content="#6200ee" />
```

### Thay đổi Description
File: `web/public/index.html` (dòng 13)
```html
<meta name="description" content="Mô tả mới của bạn" />
```

### Thay đổi OG Image
1. Thay ảnh mới vào `web/public/og-image.png`
2. Kích thước khuyến nghị: 1200x630px
3. Format: PNG hoặc JPG
4. Dung lượng: < 1MB

## 🚀 Rebuild sau khi thay đổi

Sau khi cập nhật URL hoặc meta tags:

```bash
cd web
npm run build
```

Hoặc nếu deploy trên Render, push code lên GitHub để trigger auto-deploy.

## 📊 Kết quả

Khi share link ứng dụng trên:
- **Facebook**: Hiển thị card đẹp với ảnh, title, description
- **Twitter**: Twitter Card với ảnh lớn
- **LinkedIn**: Rich preview với branding
- **iMessage/WhatsApp**: Preview với thumbnail
- **Google Search**: Rich snippets với mô tả đầy đủ

## ✨ Bonus: Local Development

Các meta tags chỉ hoạt động đầy đủ khi:
- Deploy lên production (có HTTPS)
- Các URL trong meta tags phải là absolute URL (https://...)
- OG image phải accessible công khai

Khi test local (localhost), một số tính năng như PWA install sẽ không hoạt động.
