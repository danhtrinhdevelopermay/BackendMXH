# 📋 Thông Tin Deploy - Shatter

## 🔗 URLs hiện tại:

### Backend API (Đã deploy trên Render):
```
https://backendmxh-1.onrender.com
```

**Endpoints:**
- Root: `https://backendmxh-1.onrender.com/`
- Health: `https://backendmxh-1.onrender.com/health`
- Auth API: `https://backendmxh-1.onrender.com/api/auth/*`
- Posts API: `https://backendmxh-1.onrender.com/api/posts/*`
- Messages API: `https://backendmxh-1.onrender.com/api/messages/*`
- ... (tất cả API endpoints)

**Trạng thái:** ✅ Đang chạy

---

## 📱 Mobile App:

**API URL đã cấu hình:**
```
https://backendmxh-1.onrender.com
```

File: `mobile/app.json` (line 35)

**Trạng thái:** ✅ Đã cập nhật

---

## 🌐 Web App:

**API URL đã cấu hình:**
```
https://backendmxh-1.onrender.com
```

File: `web/.env` (line 2)

**Trạng thái:** ⏳ Chưa deploy

---

## 🚀 Bước tiếp theo - Deploy Web App:

### Option 1: Deploy lên Render (Khuyến nghị)

1. **Vào Render Dashboard:** https://dashboard.render.com/
2. **Tạo Web Service:**
   - Click **"New +"** → **"Web Service"**
   - Connect repository của bạn
   - Chọn branch (ví dụ: `main` hoặc `web`)

3. **Cấu hình:**
   ```
   Name: shatter-web (hoặc tên bạn muốn)
   Region: Singapore
   Root Directory: web
   Build Command: npm install
   Start Command: npm start
   ```

4. **Add Environment Variable:**
   ```
   NODE_ENV=production
   API_URL=https://backendmxh-1.onrender.com
   ```

5. **Click "Create Web Service"**

6. **Đợi 2-3 phút** → Nhận URL web app, ví dụ:
   ```
   https://shatter-web.onrender.com
   ```

7. **Cập nhật CORS trên Backend:**
   
   Sau khi có URL web, thêm vào backend environment variables:
   ```
   WEB_APP_URL=https://shatter-web.onrender.com
   ```

### Option 2: Deploy lên Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   cd web
   vercel --prod
   ```

3. Set environment variable:
   ```bash
   vercel env add API_URL production
   # Nhập: https://backendmxh-1.onrender.com
   ```

### Option 3: Deploy lên Netlify

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Deploy:
   ```bash
   cd web
   netlify deploy --prod
   ```

---

## ✅ Checklist Deploy Web:

- [x] Backend đã deploy: `https://backendmxh-1.onrender.com`
- [x] Web app đã cấu hình API_URL
- [x] CORS đã cấu hình trên backend
- [ ] Deploy web app lên Render/Vercel/Netlify
- [ ] Test web app hoạt động
- [ ] Cập nhật WEB_APP_URL vào backend (nếu cần)

---

## 🔧 Cấu hình đã hoàn thành:

✅ Backend API URL: Đã cập nhật trong `web/.env` và `mobile/app.json`
✅ CORS: Đã cấu hình để chấp nhận requests từ web app
✅ Environment setup: Files `.env` đã sẵn sàng
✅ Package.json: Dependencies đã đầy đủ
✅ Server.js: Web server đã sẵn sàng

---

## 📝 Environment Variables cần thiết:

### Backend (trên Render):
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<your-secret>
DATABASE_URL=<postgresql-url>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
WEB_APP_URL=<web-url-after-deploy>  # Thêm sau khi deploy web
```

### Web (khi deploy):
```env
NODE_ENV=production
PORT=3000
API_URL=https://backendmxh-1.onrender.com
```

---

## 🎯 Test Backend API:

```bash
# Test root endpoint
curl https://backendmxh-1.onrender.com/

# Test health check
curl https://backendmxh-1.onrender.com/health

# Test auth endpoint (nên trả về error vì chưa có token)
curl https://backendmxh-1.onrender.com/api/auth/profile
```

---

## 📚 Tài liệu tham khảo:

- [Hướng dẫn deploy chi tiết](HUONG_DAN_DEPLOY_RENDER.md)
- [Quick Start Guide](DEPLOY_QUICK_START.md)
- [Render Documentation](https://render.com/docs)

---

## 💡 Lưu ý:

1. **Free tier Render:**
   - Backend và Web đều ngủ sau 15 phút không hoạt động
   - Request đầu tiên mất ~30 giây để "thức dậy"
   - Đủ cho development và demo

2. **Production:**
   - Nên upgrade lên paid plan ($7/tháng/service) để tránh sleep
   - Sử dụng custom domain
   - Enable monitoring và logging

3. **Security:**
   - Không commit file `.env` vào Git
   - Rotate JWT secret định kỳ
   - Enable rate limiting trong production

---

**Cập nhật lần cuối:** 2025-10-18

**Backend Status:** ✅ Running
**Web Status:** ⏳ Pending Deploy
**Mobile Status:** ✅ Configured
