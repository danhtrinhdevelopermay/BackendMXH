# 🛡️ Hệ Thống Chống Spindown

## Vấn đề

Render.com free tier tự động "spin down" (tắt) server sau **15 phút không hoạt động**. Khi có request mới, server phải "spin up" lại, mất **30-60 giây** → Trải nghiệm người dùng kém.

## Giải pháp

Landing page tự động **ping chính nó** mỗi **14 phút** để giữ server luôn active.

## Cách hoạt động

```javascript
// server.js

// 1. Tạo health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// 2. Chỉ chạy trên Render (production)
if (process.env.RENDER) {
  console.log('🔄 Anti-spindown system activated');
  
  // 3. Ping endpoint /health mỗi 14 phút
  function keepAlive() {
    axios.get(`${RENDER_URL}/health`)
      .then(response => {
        console.log('✅ Self-ping successful');
      })
      .catch(error => {
        console.error('❌ Self-ping failed');
      });
  }
  
  // Ping sau 30s đầu tiên
  setTimeout(keepAlive, 30000);
  
  // Sau đó ping mỗi 14 phút
  setInterval(keepAlive, 14 * 60 * 1000);
}
```

## Tại sao 14 phút?

- Render spin down sau **15 phút** không hoạt động
- Ping mỗi **14 phút** → Đảm bảo luôn có activity trước khi đạt 15 phút
- Buffer 1 phút để an toàn (network delay, etc.)

## Kiểm tra hoạt động

### Trong Render Logs:

```bash
# Khi server start:
Landing page server running on port 10000
🔄 Anti-spindown system activated for https://shattering.onrender.com

# Sau 30 giây:
✅ Self-ping successful at 2025-01-19T10:00:30.000Z: Status 200

# Sau mỗi 14 phút:
✅ Self-ping successful at 2025-01-19T10:14:30.000Z: Status 200
✅ Self-ping successful at 2025-01-19T10:28:30.000Z: Status 200
✅ Self-ping successful at 2025-01-19T10:42:30.000Z: Status 200
```

### Test thủ công:

```bash
# Check health endpoint
curl https://shattering.onrender.com/health

# Response:
{
  "status": "ok",
  "timestamp": "2025-01-19T10:00:00.000Z"
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RENDER` | Auto | - | Tự động set bởi Render, dùng để detect production |
| `RENDER_URL` | Optional | `https://shattering.onrender.com` | URL của landing page |

## Lợi ích

✅ **Không downtime:** Server luôn sẵn sàng phản hồi
✅ **Trải nghiệm tốt:** Không delay 30-60s khi user truy cập
✅ **Miễn phí:** Hoạt động với Render free tier
✅ **Tự động:** Không cần can thiệp thủ công
✅ **Dev-friendly:** Tự tắt trong development mode

## Chi phí

### Bandwidth Usage

**Mỗi ping:**
- Request: ~200 bytes
- Response: ~100 bytes
- **Total:** ~300 bytes/ping

**Mỗi ngày:**
- 24 hours × 60 minutes ÷ 14 minutes = ~103 pings/day
- 103 pings × 300 bytes = **~30 KB/day**

**Mỗi tháng:**
- 30 days × 30 KB = **~900 KB/month** (< 1 MB!)

**Kết luận:** Chi phí bandwidth **cực kỳ thấp**, hoàn toàn nằm trong free tier (100GB/month).

## Monitoring

### Option 1: Render Logs (Built-in)

```bash
# Vào Render Dashboard → Your Service → Logs
# Search: "Self-ping"
# Sẽ thấy logs mỗi 14 phút
```

### Option 2: UptimeRobot (External)

```bash
# Setup:
1. Tạo account: https://uptimerobot.com
2. Add Monitor:
   - Type: HTTP(s)
   - URL: https://shattering.onrender.com/health
   - Interval: 5 minutes
3. Alert qua email nếu down
```

### Option 3: Uptime Kuma (Self-hosted)

```bash
# Deploy Uptime Kuma trên Render/Vercel
# Monitor multiple services
# Beautiful dashboard
```

## Troubleshooting

### Server vẫn bị spindown?

**Check 1:** Logs có thấy anti-spindown activate không?
```
🔄 Anti-spindown system activated...
```

**Nếu không:**
- Verify env var `RENDER` có được set không
- Check code có chạy trong production mode không

**Check 2:** Logs có thấy self-ping không?
```
✅ Self-ping successful...
```

**Nếu không:**
- Check `RENDER_URL` đúng chưa
- Test health endpoint: `curl https://your-url.onrender.com/health`
- Check axios installed: `npm list axios`

**Check 3:** Ping có thành công không?

**Nếu fail:**
```
❌ Self-ping failed at 2025-01-19T10:00:00.000Z: ECONNREFUSED
```

**Giải pháp:**
1. Verify server đang chạy
2. Check firewall/security settings
3. Test với external tool: `curl https://your-url.onrender.com/health`

### Giảm interval

Nếu vẫn gặp spindown, giảm interval xuống **10 phút**:

```javascript
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes
```

### Kết hợp monitoring external

Dùng cả internal ping + external monitoring:

```javascript
// Internal: Mỗi 14 phút
setInterval(keepAlive, 14 * 60 * 1000);

// External: UptimeRobot mỗi 5 phút
// → Double protection!
```

## Alternatives

### 1. Upgrade Render Plan

**Render Paid ($7/month):**
- ✅ Always-on (không spindown)
- ✅ Không cần anti-spindown
- ✅ Faster startup
- ⚠️ Phải trả tiền

### 2. External Pinger Services

**Free Services:**
- [UptimeRobot](https://uptimerobot.com) - 50 monitors free
- [Pingdom](https://pingdom.com) - 100 checks/month free
- [StatusCake](https://statuscake.com) - Free tier

**Pros:**
- ✅ Không cần code
- ✅ Email alerts
- ✅ Uptime dashboard

**Cons:**
- ⚠️ Phụ thuộc external service
- ⚠️ Limit số monitors

### 3. Cron Jobs (Render Cron)

**Render Cron Jobs:**
```yaml
# render.yaml
services:
  - type: cron
    name: keep-alive
    schedule: "*/10 * * * *"  # Mỗi 10 phút
    command: "curl https://your-app.onrender.com/health"
```

**Pros:**
- ✅ Native Render feature
- ✅ Không cần code trong app

**Cons:**
- ⚠️ Cần file config riêng
- ⚠️ Phức tạp hơn

## Kết luận

Self-ping solution là:
- ✅ **Đơn giản nhất**
- ✅ **Miễn phí**
- ✅ **Hiệu quả**
- ✅ **Không cần external service**

Phù hợp cho:
- 🎯 Hobby projects
- 🎯 MVP/Prototype
- 🎯 Landing pages
- 🎯 Low-traffic apps

**Recommendation:** Dùng self-ping cho development/testing, upgrade lên paid plan khi có production traffic.

---

**Reference:** [Render Spindown Solution](https://dev.to/harshgit98/solution-for-rendercom-web-services-spin-down-due-to-inactivity-2h8i)
