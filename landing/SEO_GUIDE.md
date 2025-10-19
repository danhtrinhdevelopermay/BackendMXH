# 🚀 Hướng Dẫn SEO cho Shatter Landing Page

## ✅ Đã Triển Khai

### 1. Google Site Verification
```html
<meta name="google-site-verification" content="VN8Krj18yVXWXXo3Tnqsf7Dc0J0YrBVWe7Ak3gt3FWg" />
```
✅ Đã thêm vào `<head>` của trang

### 2. Meta Tags Cơ Bản
- ✅ Title tag tối ưu (60-70 ký tự)
- ✅ Meta description (150-160 ký tự)
- ✅ Meta keywords
- ✅ Author: Danh Trình
- ✅ Robots: index, follow
- ✅ Language: Vietnamese
- ✅ Canonical URL

### 3. Open Graph (Facebook)
- ✅ og:type, og:url, og:title
- ✅ og:description
- ✅ og:image (1200x630px)
- ✅ og:site_name, og:locale

### 4. Twitter Card
- ✅ twitter:card (summary_large_image)
- ✅ twitter:title, twitter:description
- ✅ twitter:image

### 5. Structured Data (JSON-LD)
- ✅ Schema.org SoftwareApplication
- ✅ Thông tin rating, giá, platform
- ✅ Author và Publisher: Danh Trình

### 6. Files SEO
- ✅ `robots.txt` - Hướng dẫn crawler
- ✅ `sitemap.xml` - Bản đồ website
- ✅ `site.webmanifest` - PWA manifest

### 7. Thông Tin Bổ Sung
- ✅ Geo tags (Vietnam)
- ✅ Theme color
- ✅ Mobile app capable
- ✅ Copyright: Danh Trình

---

## 📋 Các Bước Tiếp Theo

### Bước 1: Xác Minh Google Search Console

1. Truy cập: [Google Search Console](https://search.google.com/search-console)
2. Thêm property: `https://shatterlandingpage.onrender.com`
3. Chọn phương thức xác minh: **HTML tag**
4. Google sẽ phát hiện thẻ meta verification đã thêm
5. Click "Verify" để hoàn tất

### Bước 2: Submit Sitemap

Sau khi xác minh thành công:
1. Vào mục **Sitemaps** trong Google Search Console
2. Thêm URL sitemap: `https://shatterlandingpage.onrender.com/sitemap.xml`
3. Click **Submit**

### Bước 3: Tạo Social Media Images

Cần tạo các hình ảnh sau:

**Open Graph Image:**
- File: `og-image.png`
- Kích thước: 1200 x 630 px
- Nội dung: Logo Shatter + slogan

**Twitter Image:**
- File: `twitter-image.png`
- Kích thước: 1200 x 675 px
- Tương tự OG image

**Favicon:**
- `favicon-32x32.png` (32x32)
- `favicon-16x16.png` (16x16)
- `apple-touch-icon.png` (180x180)

**PWA Icons:**
- `android-chrome-192x192.png` (192x192)
- `android-chrome-512x512.png` (512x512)

### Bước 4: Tối Ưu Hóa Content

**Heading Tags (H1-H6):**
```html
<h1>Kết nối là một cách tốt hơn...</h1>  ✅ Đã có
<h2>Trải nghiệm được trao quyền...</h2> ✅ Đã có
```

**Alt Text cho Images:**
- Thêm alt text mô tả cho tất cả hình ảnh
- Sử dụng keywords tự nhiên

**Internal Links:**
- ✅ Đã có (Features, About, Download, etc.)

**External Links:**
- Cân nhắc thêm link đến blog hoặc social media

### Bước 5: Performance Optimization

**Page Speed:**
```bash
# Test với Google PageSpeed Insights
https://pagespeed.web.dev/
```

**Cải thiện:**
- Minify CSS/JS
- Optimize images (WebP format)
- Enable compression
- Browser caching

---

## 🔍 Theo Dõi SEO

### Google Search Console Metrics

Sau 7-14 ngày, kiểm tra:
- **Impressions**: Số lần hiển thị trên Google
- **Clicks**: Số lượt click
- **CTR**: Click-through rate
- **Average Position**: Vị trí trung bình

### Google Analytics (Optional)

Thêm Google Analytics 4:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 📊 Keywords Targeting

### Primary Keywords
1. Shatter
2. Mạng xã hội Việt Nam
3. Social network Vietnam
4. Ứng dụng kết nối bạn bè

### Secondary Keywords
1. Chat real-time
2. Story sharing
3. Streak tracking
4. Tin nhắn thời gian thực
5. Mạng xã hội miễn phí

### Long-tail Keywords
1. "Ứng dụng mạng xã hội không quảng cáo"
2. "Mạng xã hội bảo mật cao Việt Nam"
3. "App kết nối bạn bè miễn phí"
4. "Ứng dụng chat có story"

---

## 🎯 Local SEO (Vietnam)

### Google My Business (Optional)
Nếu có văn phòng thực tế:
1. Tạo profile Google My Business
2. Thêm địa chỉ, số điện thoại
3. Upload hình ảnh văn phòng
4. Nhận review từ users

### Vietnamese Directories
Submit website tới:
- Cốc Cốc Search
- Zing Search
- Vietnam Web Directories

---

## ✅ Checklist Hoàn Chỉnh

- [x] Google Site Verification tag
- [x] Meta tags (title, description, keywords)
- [x] Open Graph tags
- [x] Twitter Card tags
- [x] Structured Data (JSON-LD)
- [x] robots.txt
- [x] sitemap.xml
- [x] site.webmanifest
- [x] Author credit: Danh Trình
- [ ] Social media images (OG, Twitter)
- [ ] Favicon và PWA icons
- [ ] Google Search Console verification
- [ ] Submit sitemap
- [ ] Google Analytics (optional)
- [ ] Performance optimization

---

## 📞 Support

**Website Owner:** Danh Trình  
**Website:** https://shatterlandingpage.onrender.com  
**Contact:** support@shatter.app

---

## 📚 Resources

- [Google Search Console](https://search.google.com/search-console)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)

---

**Last Updated:** January 19, 2025  
**Maintained by:** Danh Trình
