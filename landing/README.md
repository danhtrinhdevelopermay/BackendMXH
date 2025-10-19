# Shatter Landing Page

Landing page cho ứng dụng mạng xã hội Shatter.

## Cài đặt

```bash
npm install
```

## Chạy development

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

## Deploy lên Render

1. Push code lên GitHub repository
2. Tạo Web Service mới trên Render
3. Kết nối với repository
4. Cấu hình:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Root Directory:** `landing`
5. Deploy

## Cấu trúc

```
landing/
├── public/
│   ├── index.html          # Trang chủ
│   ├── privacy-policy.html # Chính sách bảo mật
│   └── styles.css          # CSS
├── server.js               # Express server
├── package.json
└── README.md
```

## URL

- Trang chủ: `/`
- Chính sách bảo mật: `/privacy-policy`
