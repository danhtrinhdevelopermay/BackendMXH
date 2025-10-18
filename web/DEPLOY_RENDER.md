# Hướng dẫn Deploy ứng dụng Web lên Render

Tài liệu này hướng dẫn chi tiết cách deploy phiên bản web của Shatter lên Render.

## Yêu cầu

1. Tài khoản GitHub
2. Tài khoản Render (miễn phí tại [render.com](https://render.com))
3. Code đã được push lên GitHub repository

## Bước 1: Chuẩn bị Repository

### 1.1. Push code lên GitHub

Nếu chưa push code lên GitHub, thực hiện các lệnh sau:

```bash
git add .
git commit -m "Add web version for deployment"
git push origin main
```

### 1.2. Kiểm tra cấu trúc thư mục

Đảm bảo repository của bạn có cấu trúc như sau:

```
your-repo/
├── web/              # Thư mục ứng dụng web
│   ├── src/
│   ├── assets/
│   ├── package.json
│   ├── app.json
│   └── ...
├── mobile/           # Thư mục ứng dụng mobile (optional)
└── backend/          # Backend API (nếu có)
```

## Bước 2: Tạo Web Service trên Render

### 2.1. Đăng nhập vào Render

1. Truy cập [https://render.com](https://render.com)
2. Đăng nhập hoặc tạo tài khoản mới (miễn phí)

### 2.2. Tạo Web Service mới

1. Click nút **"New +"** ở góc trên bên phải
2. Chọn **"Web Service"**

### 2.3. Kết nối Repository

1. Chọn **"Connect a repository"**
2. Kết nối với GitHub account của bạn (nếu chưa)
3. Chọn repository chứa dự án của bạn
4. Click **"Connect"**

### 2.4. Cấu hình Web Service

Điền các thông tin sau:

#### Thông tin cơ bản:
- **Name**: `shatter-web` (hoặc tên bạn muốn)
- **Region**: Chọn region gần bạn nhất (ví dụ: Singapore)
- **Branch**: `main` (hoặc branch bạn muốn deploy)
- **Root Directory**: `web`

#### Build & Deploy Settings:
- **Environment**: `Node`
- **Build Command**: 
  ```bash
  npm install && npx expo export --platform web
  ```
- **Start Command**: 
  ```bash
  npx serve dist -l $PORT
  ```

#### Plan:
- Chọn **"Free"** (miễn phí)

### 2.5. Environment Variables (Tùy chọn)

Nếu bạn cần thêm environment variables:

1. Click **"Advanced"**
2. Click **"Add Environment Variable"**
3. Thêm các biến cần thiết:
   - `NODE_ENV`: `production`

### 2.6. Deploy

1. Click **"Create Web Service"**
2. Render sẽ bắt đầu build và deploy ứng dụng
3. Quá trình này có thể mất **5-10 phút** cho lần đầu tiên

## Bước 3: Theo dõi quá trình Deploy

### 3.1. Xem Logs

- Render sẽ hiển thị logs real-time trong quá trình build
- Bạn có thể theo dõi tiến trình tại tab **"Logs"**

### 3.2. Các bước build sẽ thực hiện:

1. Clone repository từ GitHub
2. Chuyển đến thư mục `web`
3. Chạy `npm install` - cài đặt dependencies
4. Chạy `npx expo export --platform web` - build ứng dụng
5. Khởi động server với `serve` trên port động

### 3.3. Kiểm tra trạng thái

- **Deploy In Progress**: Đang build và deploy
- **Live**: Deploy thành công, ứng dụng đã sẵn sàng
- **Deploy Failed**: Có lỗi xảy ra (xem logs để debug)

## Bước 4: Truy cập ứng dụng

Sau khi deploy thành công:

1. URL của bạn sẽ có dạng: `https://shatter-web.onrender.com`
2. Click vào URL để mở ứng dụng
3. Ứng dụng web của bạn đã sẵn sàng!

## Bước 5: Cấu hình Custom Domain (Tùy chọn)

Nếu bạn muốn sử dụng domain riêng:

1. Mua domain (từ GoDaddy, Namecheap, v.v.)
2. Vào **Settings** của Web Service
3. Tìm phần **"Custom Domain"**
4. Thêm domain của bạn
5. Cấu hình DNS records theo hướng dẫn của Render

## Auto-Deploy

Render tự động deploy lại khi bạn push code mới:

1. Mỗi khi push code mới lên branch `main`
2. Render sẽ tự động:
   - Pull code mới
   - Build lại ứng dụng
   - Deploy version mới

## Troubleshooting

### Build Failed

**Lỗi: "npm install failed"**
- Kiểm tra file `package.json` có đầy đủ dependencies
- Đảm bảo version Node.js tương thích

**Lỗi: "expo export failed"**
- Kiểm tra log chi tiết để xem module nào bị thiếu
- Đảm bảo tất cả dependencies đã được cài đặt

### Ứng dụng không chạy

**Blank page hoặc errors**
- Mở Browser Console (F12) để xem lỗi
- Kiểm tra API URL trong `app.json`
- Đảm bảo backend API đang chạy và accessible

**Connection errors**
- Kiểm tra CORS settings trên backend
- Đảm bảo backend cho phép requests từ domain Render của bạn

### Cập nhật API URL

Nếu backend của bạn có URL khác, cập nhật file `web/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-backend-url.onrender.com"
    }
  }
}
```

Sau đó commit và push để trigger auto-deploy.

## Giới hạn của Free Plan

- Sleep sau 15 phút không hoạt động
- Khởi động lại khi có request mới (có thể mất 30-60 giây)
- 750 giờ/tháng miễn phí

Nếu cần ứng dụng luôn chạy, nâng cấp lên plan trả phí.

## Monitoring

Render cung cấp:
- **Metrics**: CPU, Memory usage
- **Logs**: Real-time logs
- **Events**: Deploy history

Truy cập tại dashboard của Web Service.

## Kết luận

Bạn đã deploy thành công ứng dụng Shatter Web lên Render! 🎉

Ứng dụng của bạn giờ đây có thể truy cập từ bất kỳ đâu trên Internet.

## Liên kết hữu ích

- [Render Documentation](https://render.com/docs)
- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
