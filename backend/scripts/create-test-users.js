require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Danh sách tên người Mỹ
const americanNames = [
  'James Smith', 'Michael Johnson', 'Robert Williams', 'David Brown', 'William Jones',
  'Richard Garcia', 'Joseph Martinez', 'Thomas Rodriguez', 'Christopher Wilson', 'Charles Anderson',
  'Daniel Taylor', 'Matthew Thomas', 'Anthony Moore', 'Mark Jackson', 'Donald White',
  'Steven Harris', 'Paul Martin', 'Andrew Thompson', 'Joshua Garcia', 'Kenneth Martinez',
  'Kevin Robinson', 'Brian Clark', 'George Lewis', 'Timothy Lee', 'Ronald Walker',
  'Edward Hall', 'Jason Allen', 'Jeffrey Young', 'Ryan Hernandez', 'Jacob King',
  'Gary Wright', 'Nicholas Lopez', 'Eric Hill', 'Jonathan Scott', 'Stephen Green',
  'Larry Adams', 'Justin Baker', 'Scott Nelson', 'Brandon Carter', 'Benjamin Mitchell',
  'Samuel Perez', 'Raymond Roberts', 'Gregory Turner', 'Alexander Phillips', 'Patrick Campbell',
  'Jack Parker', 'Dennis Evans', 'Jerry Edwards', 'Tyler Collins', 'Aaron Stewart',
  'Henry Sanchez', 'Douglas Morris', 'Jose Rogers', 'Adam Reed', 'Nathan Cook',
  'Zachary Morgan', 'Kyle Bell', 'Walter Murphy', 'Ethan Bailey', 'Jeremy Rivera',
  'Harold Cooper', 'Keith Richardson', 'Christian Cox', 'Roger Howard', 'Noah Ward',
  'Gerald Torres', 'Carl Peterson', 'Terry Gray', 'Sean Ramirez', 'Austin James',
  'Arthur Watson', 'Lawrence Brooks'
];

// Danh sách tên người Việt
const vietnameseNames = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Công', 'Phạm Minh Dũng', 'Hoàng Thu Hà',
  'Vũ Đức Hùng', 'Đặng Thị Mai', 'Bùi Văn Nam', 'Dương Thu Nga', 'Đỗ Quốc Phong',
  'Ngô Thị Quỳnh', 'Phan Văn Sơn', 'Lý Thị Trang', 'Trương Minh Tâm', 'Võ Hoàng Anh',
  'Mai Thị Bích', 'Tô Văn Cường', 'Đinh Thu Diễm', 'Lưu Minh Đức', 'Chu Thị Hương',
  'Cao Văn Khoa', 'La Thị Lan', 'Tạ Minh Long', 'Hồ Thị Mỹ', 'Thái Văn Năm',
  'Lâm Thu Oanh', 'Ông Minh Phúc', 'Diệp Thị Quyên', 'Từ Văn Sáng', 'Lương Thị Thanh',
  'Kiều Minh Tuấn', 'Huỳnh Thị Uyên', 'Đoàn Văn Vinh', 'Nghiêm Thị Xuân', 'Quách Minh Yên',
  'Tôn Văn Bảo', 'Triệu Thị Châu', 'Hà Minh Đạt', 'Khương Thị Giang', 'Âu Văn Hải',
  'Mạc Thị Khánh', 'Lương Minh Khang', 'Văn Thị Linh', 'Ứng Văn Minh', 'Trịnh Thị Ngọc',
  'Dương Văn Phương', 'Tăng Thị Quế', 'Thạch Minh Rạng', 'Lữ Thị Sương', 'Ninh Văn Tài',
  'Gia Thị Uyển', 'Bạch Minh Vũ', 'Viên Thị Yến', 'Thi Văn Bình', 'Sử Thị An',
  'Vương Minh Chiến', 'Cung Thị Duyên', 'Thang Văn Đông', 'Vân Thị Hoa', 'Lãnh Minh Hùng',
  'Thiều Thị Kim', 'Mã Văn Lợi', 'Tề Thị Mận', 'Đàm Minh Nhật', 'Phi Thị Oanh',
  'Diêm Văn Phát', 'Dung Thị Quyên'
];

async function createUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Bắt đầu tạo 134 tài khoản test...\n');
    
    // Lấy ID của tài khoản chính
    const mainUserResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['danhtrinhhhh@gmail.com']
    );
    
    if (mainUserResult.rows.length === 0) {
      console.error('❌ Không tìm thấy tài khoản danhtrinhhhh@gmail.com');
      return;
    }
    
    const mainUserId = mainUserResult.rows[0].id;
    console.log(`✅ Tìm thấy tài khoản chính - ID: ${mainUserId}\n`);
    
    // Hash password một lần để tái sử dụng (password: "test123")
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    let createdCount = 0;
    let friendshipCount = 0;
    
    // Tạo 67 tài khoản người Mỹ
    console.log('📝 Đang tạo 67 tài khoản người Mỹ...');
    for (let i = 0; i < 67; i++) {
      const name = americanNames[i];
      const username = name.toLowerCase().replace(/\s+/g, '') + (i + 1);
      const email = username + '@shatter.com';
      
      try {
        // Tạo user
        const userResult = await client.query(
          'INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id',
          [username, email, hashedPassword, name]
        );
        
        const newUserId = userResult.rows[0].id;
        createdCount++;
        
        // Tạo friendship (requester là user mới, addressee là user chính)
        await client.query(
          'INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, $3)',
          [newUserId, mainUserId, 'accepted']
        );
        
        friendshipCount++;
        
        if ((i + 1) % 10 === 0) {
          console.log(`   ✓ Đã tạo ${i + 1}/67 tài khoản người Mỹ`);
        }
      } catch (err) {
        console.error(`   ✗ Lỗi tạo ${name}: ${err.message}`);
      }
    }
    
    // Tạo 67 tài khoản người Việt
    console.log('\n📝 Đang tạo 67 tài khoản người Việt...');
    for (let i = 0; i < 67; i++) {
      const name = vietnameseNames[i];
      const username = removeVietnameseAccents(name).toLowerCase().replace(/\s+/g, '') + (i + 1);
      const email = username + '@shatter.com';
      
      try {
        // Tạo user
        const userResult = await client.query(
          'INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id',
          [username, email, hashedPassword, name]
        );
        
        const newUserId = userResult.rows[0].id;
        createdCount++;
        
        // Tạo friendship (requester là user mới, addressee là user chính)
        await client.query(
          'INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, $3)',
          [newUserId, mainUserId, 'accepted']
        );
        
        friendshipCount++;
        
        if ((i + 1) % 10 === 0) {
          console.log(`   ✓ Đã tạo ${i + 1}/67 tài khoản người Việt`);
        }
      } catch (err) {
        console.error(`   ✗ Lỗi tạo ${name}: ${err.message}`);
      }
    }
    
    console.log(`\n🎉 Hoàn thành!`);
    console.log(`   - Đã tạo: ${createdCount} tài khoản`);
    console.log(`   - Đã tạo: ${friendshipCount} mối quan hệ bạn bè`);
    console.log(`   - Tài khoản danhtrinhhhh@gmail.com giờ có ${friendshipCount} bạn bè\n`);
    
    // Verify
    const friendCount = await client.query(
      'SELECT COUNT(*) FROM friendships WHERE (requester_id = $1 OR addressee_id = $1) AND status = $2',
      [mainUserId, 'accepted']
    );
    
    console.log(`✅ Xác nhận: ${friendCount.rows[0].count} bạn bè trong database`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Hàm loại bỏ dấu tiếng Việt
function removeVietnameseAccents(str) {
  const AccentsMap = [
    'aàảãáạăằẳẵắặâầẩẫấậ',
    'AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬ',
    'dđ', 'DĐ',
    'eèẻẽéẹêềểễếệ',
    'EÈẺẼÉẸÊỀỂỄẾỆ',
    'iìỉĩíị',
    'IÌỈĨÍỊ',
    'oòỏõóọôồổỗốộơờởỡớợ',
    'OÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢ',
    'uùủũúụưừửữứự',
    'UÙỦŨÚỤƯỪỬỮỨỰ',
    'yỳỷỹýỵ',
    'YỲỶỸÝỴ'
  ];
  
  for (let i = 0; i < AccentsMap.length; i++) {
    const re = new RegExp('[' + AccentsMap[i].substr(1) + ']', 'g');
    const char = AccentsMap[i][0];
    str = str.replace(re, char);
  }
  
  return str;
}

// Chạy script
createUsers();
