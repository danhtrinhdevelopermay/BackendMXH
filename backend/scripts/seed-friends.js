const pool = require('../src/config/database');
const bcrypt = require('bcrypt');

const americanNames = [
  'James Smith', 'Michael Johnson', 'Robert Williams', 'David Brown', 'William Jones',
  'Richard Garcia', 'Joseph Miller', 'Thomas Davis', 'Christopher Rodriguez', 'Daniel Martinez',
  'Matthew Anderson', 'Anthony Taylor', 'Mark Thomas', 'Donald Jackson', 'Steven White',
  'Paul Harris', 'Andrew Martin', 'Kenneth Thompson', 'Joshua Garcia', 'Kevin Martinez',
  'Brian Robinson', 'George Clark', 'Timothy Rodriguez', 'Ronald Lewis', 'Edward Lee',
  'Jason Walker', 'Jeffrey Hall', 'Ryan Allen', 'Jacob Young', 'Nicholas Hernandez',
  'Eric King', 'Jonathan Wright', 'Stephen Lopez', 'Larry Hill', 'Justin Scott',
  'Scott Green', 'Brandon Adams', 'Benjamin Baker', 'Samuel Gonzalez', 'Frank Nelson',
  'Raymond Carter', 'Gregory Mitchell', 'Alexander Perez', 'Patrick Roberts', 'Jack Turner',
  'Dennis Phillips', 'Jerry Campbell', 'Tyler Parker', 'Aaron Evans', 'Jose Edwards',
  'Mary Johnson', 'Patricia Williams', 'Jennifer Brown', 'Linda Davis', 'Elizabeth Garcia',
  'Barbara Miller', 'Susan Anderson', 'Jessica Wilson', 'Sarah Martinez', 'Karen Taylor',
  'Nancy Moore', 'Lisa Jackson', 'Betty Martin', 'Margaret Lee', 'Sandra Thompson',
  'Ashley White', 'Kimberly Harris', 'Emily Clark', 'Donna Lewis', 'Michelle Robinson',
  'Carol Walker', 'Amanda Hall', 'Dorothy Allen', 'Melissa Young', 'Deborah King',
  'Stephanie Wright', 'Rebecca Lopez', 'Sharon Hill', 'Laura Scott', 'Cynthia Green',
];

const vietnameseNames = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung', 'Hoàng Văn Em',
  'Huỳnh Thị Hoa', 'Vũ Văn Giang', 'Đặng Thị Hương', 'Bùi Văn Khoa', 'Đỗ Thị Lan',
  'Ngô Văn Minh', 'Dương Thị Nga', 'Phan Văn Phong', 'Mai Thị Quỳnh', 'Tô Văn Sơn',
  'Lý Thị Tâm', 'Trương Văn Tùng', 'Đinh Thị Uyên', 'Võ Văn Vinh', 'Hồ Thị Xuân',
  'Nguyễn Thị Yến', 'Trần Văn Anh', 'Lê Thị Bảo', 'Phạm Văn Chi', 'Hoàng Thị Diệu',
  'Huỳnh Văn Đức', 'Vũ Thị Gia', 'Đặng Văn Hải', 'Bùi Thị Khánh', 'Đỗ Văn Long',
  'Ngô Thị Mai', 'Dương Văn Nam', 'Phan Thị Oanh', 'Mai Văn Phúc', 'Tô Thị Quyên',
  'Lý Văn Rồng', 'Trương Thị Thanh', 'Đinh Văn Thắng', 'Võ Thị Uyển', 'Hồ Văn Vũ',
  'Nguyễn Văn Hùng', 'Trần Thị Linh', 'Lê Văn Quang', 'Phạm Thị Nhung', 'Hoàng Văn Đạt',
  'Huỳnh Thị Thu', 'Vũ Văn Toàn', 'Đặng Thị Vân', 'Bùi Văn Hiếu', 'Đỗ Thị Trang',
  'Ngô Văn Kiên', 'Dương Thị Hằng', 'Phan Văn Tuấn', 'Mai Thị Hà', 'Tô Văn Bình',
  'Lý Thị Ngọc', 'Trương Văn Hoàng', 'Đinh Thị Phương', 'Võ Văn Trung', 'Hồ Thị Huyền',
  'Nguyễn Văn Thành', 'Trần Thị Kim', 'Lê Văn Tài', 'Phạm Thị Hiền', 'Hoàng Văn Lâm',
  'Huộnh Thị Thảo', 'Vũ Văn Duy', 'Đặng Thị My', 'Bùi Văn Tâm', 'Đỗ Thị Trinh',
  'Ngô Văn Hậu', 'Dương Thị Ly', 'Phan Văn Hùng', 'Mai Thị Ánh', 'Tô Văn Khải',
  'Lý Thị Châu', 'Trương Văn Phát', 'Đinh Thị Ngân', 'Võ Văn Tiến', 'Hồ Thị Diễm',
];

async function seedFriends() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Bắt đầu tạo dữ liệu test...');
    
    const targetUserId = 3;
    const numberOfFriends = 127;
    
    const targetUser = await client.query('SELECT * FROM users WHERE id = $1', [targetUserId]);
    if (targetUser.rows.length === 0) {
      console.error('❌ Không tìm thấy user với ID:', targetUserId);
      return;
    }
    
    console.log(`✅ Tìm thấy user: ${targetUser.rows[0].full_name} (${targetUser.rows[0].email})`);
    
    const allNames = [...americanNames, ...vietnameseNames];
    const selectedNames = [];
    
    for (let i = 0; i < numberOfFriends; i++) {
      const randomIndex = Math.floor(Math.random() * allNames.length);
      selectedNames.push(allNames[randomIndex]);
    }
    
    console.log(`\n📝 Tạo ${numberOfFriends} tài khoản giả...`);
    
    const defaultPassword = await bcrypt.hash('Password123!', 10);
    const createdUserIds = [];
    
    for (let i = 0; i < selectedNames.length; i++) {
      const fullName = selectedNames[i];
      const username = fullName.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/\s+/g, '')
        + Math.floor(Math.random() * 10000);
      
      const email = `${username}@test.com`;
      
      try {
        const result = await client.query(
          `INSERT INTO users (username, email, password_hash, full_name, bio, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
           RETURNING id`,
          [username, email, defaultPassword, fullName, `Đây là tài khoản test`, ]
        );
        
        createdUserIds.push(result.rows[0].id);
        
        if ((i + 1) % 20 === 0) {
          console.log(`   ✓ Đã tạo ${i + 1}/${numberOfFriends} tài khoản...`);
        }
      } catch (error) {
        console.error(`   ⚠️  Lỗi khi tạo user ${username}:`, error.message);
      }
    }
    
    console.log(`\n👥 Tạo quan hệ bạn bè...`);
    
    for (let i = 0; i < createdUserIds.length; i++) {
      const friendId = createdUserIds[i];
      
      try {
        await client.query(
          `INSERT INTO friendships (requester_id, addressee_id, status, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (requester_id, addressee_id) DO NOTHING`,
          [targetUserId, friendId, 'accepted']
        );
        
        if ((i + 1) % 20 === 0) {
          console.log(`   ✓ Đã tạo ${i + 1}/${createdUserIds.length} quan hệ bạn bè...`);
        }
      } catch (error) {
        console.error(`   ⚠️  Lỗi khi tạo friendship:`, error.message);
      }
    }
    
    const friendCount = await client.query(
      `SELECT COUNT(*) as count FROM friendships 
       WHERE (requester_id = $1 OR addressee_id = $1) AND status = 'accepted'`,
      [targetUserId]
    );
    
    console.log(`\n✅ Hoàn thành!`);
    console.log(`📊 Tổng số bạn bè của ${targetUser.rows[0].full_name}: ${friendCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedFriends();
