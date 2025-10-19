require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/database');

const VIETNAMESE_FIRST_NAMES = [
  'Minh', 'Hương', 'Tuấn', 'Linh', 'Hoàng', 'Thảo', 'Quân', 'Hà', 'Dũng', 'Ngọc',
  'Khánh', 'Mai', 'Long', 'Trang', 'Hùng', 'Lan', 'Phong', 'Huyền', 'Anh', 'Thu',
  'Nam', 'Hoa', 'Tú', 'Yến', 'Đức', 'Nhung', 'Cường', 'Vân', 'Tâm', 'Phương',
  'Bảo', 'Hằng', 'Sơn', 'Diệu', 'Trung', 'My', 'Việt', 'Ly', 'Khoa', 'Trinh',
  'Hải', 'Loan', 'Toàn', 'Xuân', 'Thắng', 'Chi', 'Bình', 'Kim', 'Đạt', 'Thanh'
];

const VIETNAMESE_LAST_NAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đào', 'Cao', 'Mai'
];

const AVATAR_URLS = [
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=2',
  'https://i.pravatar.cc/150?img=3',
  'https://i.pravatar.cc/150?img=5',
  'https://i.pravatar.cc/150?img=6',
  'https://i.pravatar.cc/150?img=7',
  'https://i.pravatar.cc/150?img=8',
  'https://i.pravatar.cc/150?img=9',
  'https://i.pravatar.cc/150?img=11',
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=13',
  'https://i.pravatar.cc/150?img=14',
  'https://i.pravatar.cc/150?img=15',
  'https://i.pravatar.cc/150?img=16',
  'https://i.pravatar.cc/150?img=17',
  'https://i.pravatar.cc/150?img=18',
  'https://i.pravatar.cc/150?img=19',
  'https://i.pravatar.cc/150?img=20'
];

const BIOS = [
  'Yêu thích du lịch và khám phá 🌏',
  'Đam mê nhiếp ảnh 📷',
  'Người yêu âm nhạc 🎵',
  'Thích đọc sách và cafe ☕',
  'Cuộc sống là những chuyến đi 🚗',
  'Hạnh phúc là những điều giản dị ✨',
  'Sống chậm, yêu nhiều 💙',
  'Mình là người lạc quan và vui vẻ 😊',
  'Thích nấu ăn và ăn ngon 🍜',
  'Người mê thể thao và sống khỏe 💪',
  null, null, null
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateVietnameseName() {
  const lastName = getRandomElement(VIETNAMESE_LAST_NAMES);
  const firstName = getRandomElement(VIETNAMESE_FIRST_NAMES);
  const middleName = Math.random() > 0.5 ? getRandomElement(VIETNAMESE_FIRST_NAMES) : '';
  return middleName ? `${lastName} ${middleName} ${firstName}` : `${lastName} ${firstName}`;
}

function generateUsername(fullName, suffix) {
  const nameParts = fullName.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .split(' ');
  
  const firstName = nameParts[nameParts.length - 1];
  const lastName = nameParts[0];
  
  const patterns = [
    `${firstName}${lastName}${suffix}`,
    `${firstName}.${lastName}${suffix}`,
    `${firstName}_${lastName}${suffix}`,
    `${lastName}${firstName}${suffix}`,
  ];
  
  return getRandomElement(patterns);
}

async function createFakeUsers(count = 100) {
  console.log(`🚀 Bắt đầu tạo ${count} tài khoản ảo...`);
  
  const password = 'FakeUser123';
  const password_hash = await bcrypt.hash(password, 10);
  
  let successCount = 0;
  let failCount = 0;
  const createdUsers = [];

  for (let i = 1; i <= count; i++) {
    try {
      const fullName = generateVietnameseName();
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 9999);
      const suffix = `${randomNum}`;
      const username = generateUsername(fullName, suffix);
      const email = `${username}@fake.com`;
      const avatar_url = getRandomElement(AVATAR_URLS);
      const bio = getRandomElement(BIOS);
      
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash, full_name, avatar_url, bio, is_verified) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, username, full_name`,
        [username, email, password_hash, fullName, avatar_url, bio, false]
      );
      
      createdUsers.push(result.rows[0]);
      successCount++;
      
      if (successCount % 10 === 0) {
        console.log(`✅ Đã tạo ${successCount}/${count} tài khoản...`);
      }
    } catch (error) {
      failCount++;
      console.error(`❌ Lỗi tạo tài khoản ${i}:`, error.message);
    }
  }
  
  console.log('\n📊 Kết quả:');
  console.log(`✅ Thành công: ${successCount}`);
  console.log(`❌ Thất bại: ${failCount}`);
  console.log(`📝 Mật khẩu mặc định cho tất cả tài khoản ảo: ${password}`);
  
  if (createdUsers.length > 0) {
    console.log('\n👥 Một số tài khoản ảo đã tạo:');
    createdUsers.slice(0, 5).forEach(user => {
      console.log(`   - ID: ${user.id} | Username: ${user.username} | Name: ${user.full_name}`);
    });
  }
  
  await pool.end();
  return createdUsers;
}

const count = parseInt(process.argv[2]) || 100;
createFakeUsers(count)
  .then(() => {
    console.log('\n✨ Hoàn thành!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Lỗi nghiêm trọng:', error);
    process.exit(1);
  });
