# Hướng dẫn Deploy Web App lên Render

## Bước 1: Chuẩn bị

1. Đảm bảo bạn đã có tài khoản Render tại: https://render.com
2. Đẩy code lên GitHub repository (branch web)

## Bước 2: Tạo Web Service trên Render

1. Đăng nhập vào Render Dashboard
2. Click **"New +"** → Chọn **"Web Service"**
3. Kết nối GitHub repository của bạn
4. Chọn branch **web**

## Bước 3: Cấu hình Web Service

### Build Settings:
- **Name**: `shatter-web` (hoặc tên bạn muốn)
- **Region**: Singapore (hoặc gần user nhất)
- **Branch**: `web`
- **Root Directory**: `web`
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Environment Variables:

Thêm các biến môi trường sau:

| Key | Value | Mô tả |
|-----|-------|-------|
| `NODE_ENV` | `production` | Môi trường production |
| `PORT` | `3000` | Port mặc định (Render tự động gán) |
| `API_URL` | URL backend API của bạn | URL của backend đã deploy trên Render |

**Ví dụ API_URL**:
```
https://shatter-backend.onrender.com
```

## Bước 4: Deploy

1. Click **"Create Web Service"**
2. Render sẽ tự động:
   - Clone repository
   - Cài đặt dependencies
   - Build và deploy
   - Cung cấp URL public

## Bước 5: Kiểm tra

1. Sau khi deploy thành công, bạn sẽ nhận được URL:
   ```
   https://shatter-web.onrender.com
   ```

2. Truy cập URL và kiểm tra:
   - Web app hiển thị đúng
   - Có thể đăng ký/đăng nhập
   - Kết nối với backend API hoạt động

## Bước 6: Cấu hình Backend CORS (Quan trọng!)

Trên backend service, đảm bảo CORS được cấu hình để chấp nhận request từ web domain:

Trong file `backend/server.js`:
```javascript
app.use(cors({
  origin: [
    'https://shatter-web.onrender.com',  // Web app URL
    'https://your-other-domains.com'
  ],
  credentials: true
}));
```

## Lưu ý:

### Free Tier Limitations:
- Web service sẽ "ngủ" sau 15 phút không hoạt động
- Lần truy cập đầu tiên sẽ mất ~30 giây để "thức dậy"
- Bandwidth giới hạn 100GB/tháng

### Tối ưu hóa:
- Sử dụng Render.yaml để tự động hóa deploy
- Cấu hình health check endpoint
- Enable auto-deploy khi push code mới

## Deploy bằng render.yaml (Tự động)

File `render.yaml` đã được tạo sẵn trong thư mục web:

```yaml
services:
  - type: web
    name: shatter-web
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: API_URL
        sync: false
      - key: NODE_ENV
        value: production
```

Với file này, bạn chỉ cần:
1. Push code lên GitHub
2. Kết nối repository với Render
3. Render tự động đọc cấu hình và deploy

## Troubleshooting

### Web không kết nối được Backend:
- Kiểm tra `API_URL` environment variable
- Kiểm tra CORS trên backend
- Kiểm tra backend đang chạy

### Build Failed:
- Kiểm tra `package.json` có đúng dependencies
- Kiểm tra Node version (>= 18.0.0)
- Xem logs để debug

### Tốc độ chậm:
- Upgrade lên paid plan để tránh sleep
- Sử dụng CDN cho static assets
- Tối ưu hóa images và resources

## Tác giả

Deploy guide cho Shatter Web App
