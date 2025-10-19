# 🔧 Sửa Lỗi Nghiêm Trọng: User Bị Trùng ID Giữa 2 Databases

## 🚨 Vấn Đề

Hệ thống có 2 databases (primary và secondary) với dữ liệu user bị trùng ID:
- **Khi login**: Đăng nhập tài khoản A (ID=1) từ database chính
- **Khi reload app**: Lại hiện tài khoản B (ID=1) từ database phụ
- **Nguyên nhân**: Không nhất quán giữa database được query khi login và khi getProfile

## 🔍 Phân Tích Nguyên Nhân

### Trước khi sửa:

1. **Khi login** (`authController.js` line 55-86):
   ```javascript
   // Query từ CẢ 2 databases
   const results = await pool.queryBoth(
     'SELECT * FROM users WHERE username = $1 OR email = $1',
     [username]
   );
   
   // Ưu tiên lấy từ primary, nếu không có thì lấy từ secondary
   if (results.primary && results.primary.rows.length > 0) {
     user = results.primary.rows[0];
     dbSource = 'primary';
   } else if (results.secondary && results.secondary.rows.length > 0) {
     user = results.secondary.rows[0];
     dbSource = 'secondary';
   }
   
   // Tạo JWT token KHÔNG có thông tin database source
   const token = jwt.sign({ id: user.id, username: user.username }, ...);
   ```

2. **Khi getProfile/reload app** (`authController.js` line 93-109):
   ```javascript
   // Chỉ query 1 database (với failover automatic)
   const result = await pool.query(
     'SELECT ... FROM users WHERE id = $1',
     [req.user.id]
   );
   ```
   
   - Method `query()` có thể tự động chuyển sang secondary database nếu có failover
   - Không biết user này đến từ database nào
   - **→ Nếu có failover, sẽ query database khác và lấy nhầm user có cùng ID!**

## ✅ Giải Pháp Đã Áp Dụng

### 1. Lưu `dbSource` vào JWT Token

**File: `backend/src/controllers/authController.js`**

#### Login:
```javascript
const token = jwt.sign({ 
  id: user.id, 
  username: user.username,
  dbSource: dbSource  // ✅ Thêm thông tin database source
}, JWT_SECRET, { expiresIn: '7d' });
```

#### Register:
```javascript
const token = jwt.sign({ 
  id: user.id, 
  username: user.username,
  dbSource: 'primary'  // ✅ User mới luôn tạo ở primary
}, JWT_SECRET, { expiresIn: '7d' });
```

### 2. Query Đúng Database Source

#### getProfile:
```javascript
const getProfile = async (req, res) => {
  try {
    const dbSource = req.user.dbSource || 'primary';
    let result;
    
    // ✅ Query đúng database đã login
    if (dbSource === 'primary') {
      result = await pool.primary.query(
        'SELECT ... FROM users WHERE id = $1',
        [req.user.id]
      );
    } else {
      result = await pool.secondary.query(
        'SELECT ... FROM users WHERE id = $1',
        [req.user.id]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
```

#### updateProfile, updateAvatar, updateCover:
- Tất cả đều được sửa để query đúng database source
- Đảm bảo update đúng user trong đúng database

## 🎯 Kết Quả

### Trước khi sửa:
1. User A (ID=1) login từ **primary database**
2. JWT token chỉ có: `{ id: 1, username: 'userA' }`
3. Khi reload app → getProfile query từ **secondary database** (nếu có failover)
4. Lấy nhầm User B (ID=1) từ secondary database ❌

### Sau khi sửa:
1. User A (ID=1) login từ **primary database**
2. JWT token có: `{ id: 1, username: 'userA', dbSource: 'primary' }` ✅
3. Khi reload app → getProfile query từ **primary database**
4. Lấy đúng User A (ID=1) từ primary database ✅

## 📋 Các Files Đã Sửa

1. **`backend/src/controllers/authController.js`**:
   - ✅ `login()`: Thêm dbSource vào JWT token
   - ✅ `register()`: Thêm dbSource vào JWT token (luôn là 'primary')
   - ✅ `getProfile()`: Query đúng database source
   - ✅ `updateProfile()`: Update đúng database source
   - ✅ `updateAvatar()`: Update đúng database source
   - ✅ `updateCover()`: Update đúng database source

## 🔒 Bảo Mật

- Các operations khác (posts, messages, friendships...) vẫn giữ nguyên:
  - **INSERT**: Vào primary database với automatic failover
  - **SELECT**: Sử dụng `queryAll()` để merge từ cả 2 databases
- Chỉ thông tin user authentication mới cần query đúng database source
- Đảm bảo tính nhất quán và bảo mật cho user accounts

## 🧪 Cách Test

1. **Đăng nhập** với một tài khoản từ primary database
2. **Reload app** nhiều lần
3. **Kiểm tra** thông tin user vẫn giữ nguyên
4. **Không bao giờ** hiện tài khoản khác có cùng ID từ database phụ

## ⚠️ Lưu Ý Quan Trọng

- User đã login trước đó cần **đăng nhập lại** để có JWT token mới với dbSource
- Sau khi đăng nhập lại, vấn đề sẽ được giải quyết hoàn toàn
- Hệ thống giờ đảm bảo tính nhất quán 100% cho user authentication
