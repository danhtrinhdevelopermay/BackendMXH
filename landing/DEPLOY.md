# Hướng dẫn Deploy Landing Page lên Render.com

## 📋 Chuẩn bị

### 1. Xử lý File Lớn

Landing page chứa 2 file download:
- `Shatter-Android.apk` (~72MB)
- `Shatter-iOS.tar.gz` (~21MB)

**Lựa chọn A: Sử dụng Git LFS** (Khuyến nghị nếu muốn host file trên Git)

```bash
# Cài Git LFS
git lfs install

# File .gitattributes đã có sẵn với config:
# *.apk filter=lfs diff=lfs merge=lfs -text
# *.tar.gz filter=lfs diff=lfs merge=lfs -text

# Track và push
git add landing/.gitattributes
git add landing/public/downloads/
git commit -m "Add app downloads with Git LFS"
git push
```

**Lựa chọn B: Sử dụng Cloudinary/S3** (Khuyến nghị cho production)

```bash
# 1. Upload file lên Cloudinary hoặc S3
# 2. Cập nhật link trong landing/public/index.html:

<a href="https://res.cloudinary.com/your-cloud/Shatter-Android.apk" ...>
<a href="https://res.cloudinary.com/your-cloud/Shatter-iOS.tar.gz" ...>
```

## 🚀 Deploy trên Render

### Bước 1: Tạo Web Service

1. Đăng nhập vào [Render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository của bạn
4. Chọn repository `shatter` (hoặc tên repo của bạn)

### Bước 2: Cấu hình Service

**Basic Settings:**
- **Name:** `shatter-landing` (hoặc tên bạn muốn)
- **Region:** Singapore (hoặc gần user nhất)
- **Branch:** `main` (hoặc branch bạn dùng)
- **Root Directory:** Leave blank (để trống)

**Build & Deploy:**
- **Runtime:** `Node`
- **Build Command:**
  ```bash
  cd landing && npm install
  ```
- **Start Command:**
  ```bash
  cd landing && npm start
  ```

### Bước 3: Environment Variables

Thêm biến môi trường (optional, nhưng recommended):

| Key | Value | Description |
|-----|-------|-------------|
| `RENDER_URL` | `https://your-app-name.onrender.com` | URL của landing page |
| `NODE_ENV` | `production` | Môi trường production |

**Lưu ý:** Render tự động set biến `RENDER=true`, không cần thêm.

### Bước 4: Deploy

1. Click **"Create Web Service"**
2. Đợi build và deploy (khoảng 2-5 phút)
3. Kiểm tra logs để verify anti-spindown đã active

## ✅ Verify Deploy

### 1. Kiểm tra Website

Truy cập URL của bạn: `https://your-app-name.onrender.com`

Verify:
- ✅ Trang chủ load đúng
- ✅ Download buttons hoạt động
- ✅ Privacy policy page accessible
- ✅ Install guide page accessible

### 2. Kiểm tra Anti-Spindown System

Trong Render Dashboard → Logs, bạn sẽ thấy:

```
Landing page server running on port 10000
🔄 Anti-spindown system activated for https://your-app-name.onrender.com
✅ Self-ping successful at 2025-01-19T10:00:00.000Z: Status 200
```

Sau mỗi 14 phút, bạn sẽ thấy log mới:
```
✅ Self-ping successful at 2025-01-19T10:14:00.000Z: Status 200
```

### 3. Test Downloads

```bash
# Test Android download
curl -I https://your-app-name.onrender.com/downloads/Shatter-Android.apk

# Test iOS download  
curl -I https://your-app-name.onrender.com/downloads/Shatter-iOS.tar.gz
```

Nên thấy `HTTP/2 200` hoặc `HTTP/2 302` (redirect).

## 🔧 Troubleshooting

### Problem: Build Failed

**Solution:**
- Verify `package.json` có đúng dependencies
- Check logs để xem lỗi cụ thể
- Đảm bảo Node version compatible (v18+)

### Problem: Downloads không hoạt động

**Solution:**

1. **Nếu dùng Git LFS:**
   ```bash
   # Verify LFS đang track files
   git lfs ls-files
   
   # Nên thấy:
   # abc123 * landing/public/downloads/Shatter-Android.apk
   # def456 * landing/public/downloads/Shatter-iOS.tar.gz
   ```

2. **Nếu file quá lớn:**
   - Chuyển sang dùng Cloudinary/S3
   - Update links trong HTML

### Problem: Server vẫn bị spindown

**Solution:**

1. Check logs có thấy self-ping không:
   ```
   🔄 Anti-spindown system activated...
   ✅ Self-ping successful...
   ```

2. Nếu không thấy:
   - Verify biến `RENDER` có được set không
   - Check `RENDER_URL` đúng chưa
   - Restart service

3. Nếu vẫn fail:
   - Giảm interval từ 14 phút xuống 10 phút
   - Thêm external monitoring (UptimeRobot, Pingdom)

### Problem: 502 Bad Gateway

**Solution:**
- Server chưa start xong, đợi 1-2 phút
- Check logs xem có error khi start không
- Verify port binding đúng (Render tự set PORT)

## 🎯 Best Practices

### 1. Custom Domain (Optional)

Trong Render Dashboard:
1. Settings → Custom Domain
2. Add domain: `shatter.app` hoặc `landing.shatter.app`
3. Update DNS records theo hướng dẫn
4. Update `RENDER_URL` env var

### 2. SSL Certificate

Render tự động cấp SSL certificate miễn phí từ Let's Encrypt.
- Tự động renew
- Bật HTTPS enforce

### 3. Monitoring

**Free Options:**
- **UptimeRobot:** Ping mỗi 5 phút
- **Pingdom:** Monitor uptime
- **Render Dashboard:** Built-in metrics

**Setup UptimeRobot:**
1. Tạo account tại [uptimerobot.com](https://uptimerobot.com)
2. Add New Monitor:
   - Type: HTTP(s)
   - URL: `https://your-app-name.onrender.com/health`
   - Interval: 5 minutes
3. Alert via email khi down

### 4. Performance

**Optimize Assets:**
```bash
# Minify CSS (nếu cần)
npx clean-css-cli -o landing/public/styles.min.css landing/public/styles.css

# Optimize images (nếu có)
npx imagemin landing/public/images/* --out-dir=landing/public/images
```

**Enable Compression:**
Server đã có Express, có thể thêm compression:
```javascript
const compression = require('compression');
app.use(compression());
```

## 📊 Cost Estimate

### Free Tier (Render)
- ✅ 750 hours/month miễn phí
- ✅ Auto-suspend sau 15 phút (nhưng ta đã có anti-spindown)
- ✅ SSL miễn phí
- ⚠️ Bandwidth: 100GB/month

### Paid Plan ($7/month)
- ✅ Always-on (không suspend)
- ✅ Faster build
- ✅ Priority support
- ✅ More bandwidth

**Khuyến nghị:**
- Development: Dùng Free tier + anti-spindown
- Production: Upgrade lên $7/month plan nếu traffic cao

## 🔄 Update & Redeploy

### Auto Deploy (Recommended)

Render tự động deploy khi push code:
```bash
git add .
git commit -m "Update landing page"
git push
```

### Manual Deploy

Trong Render Dashboard:
1. Click **"Manual Deploy"**
2. Chọn branch
3. Click **"Deploy"**

### Rolling Back

1. Render Dashboard → Deploys
2. Tìm deploy version cũ
3. Click **"Redeploy"**

## 📞 Support

Nếu gặp vấn đề:
1. Check [Render Docs](https://render.com/docs)
2. Check [Render Status](https://status.render.com)
3. Email: support@shatter.app

---

**Happy Deploying! 🚀**
