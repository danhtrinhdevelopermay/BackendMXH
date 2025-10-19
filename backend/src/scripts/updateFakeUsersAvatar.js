require('dotenv').config();
const pool = require('../config/database');

const DICEBEAR_STYLES = [
  'pixel-art',
  'avataaars',
  'bottts',
  'lorelei',
  'micah',
  'adventurer',
  'big-ears',
  'big-smile',
  'miniavs',
  'open-peeps',
  'personas',
  'fun-emoji',
  'notionists',
  'croodles',
  'thumbs',
  'shapes'
];

function generateDiceBearAvatar(email) {
  const style = DICEBEAR_STYLES[Math.floor(Math.random() * DICEBEAR_STYLES.length)];
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(email)}`;
}

async function updateFakeUsersAvatar() {
  console.log('🚀 Bắt đầu cập nhật avatar cho các tài khoản @fake.com...\n');
  
  try {
    const result = await pool.query(
      "SELECT id, email, username, full_name FROM users WHERE email LIKE '%@fake.com'"
    );
    
    const users = result.rows;
    console.log(`📊 Tìm thấy ${users.length} tài khoản @fake.com\n`);
    
    if (users.length === 0) {
      console.log('✅ Không có tài khoản nào cần cập nhật.');
      await pool.end();
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const user of users) {
      try {
        const newAvatarUrl = generateDiceBearAvatar(user.email);
        
        await pool.query(
          'UPDATE users SET avatar_url = $1 WHERE id = $2',
          [newAvatarUrl, user.id]
        );
        
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`✅ Đã cập nhật ${successCount}/${users.length} tài khoản...`);
        }
      } catch (error) {
        failCount++;
        console.error(`❌ Lỗi cập nhật ${user.email}:`, error.message);
      }
    }
    
    console.log('\n📊 Kết quả:');
    console.log(`✅ Thành công: ${successCount}`);
    console.log(`❌ Thất bại: ${failCount}`);
    console.log(`\n✨ Hoàn thành! Tất cả tài khoản @fake.com đã có avatar riêng biệt.`);
    
    if (successCount > 0) {
      console.log('\n👥 Một số ví dụ:');
      const samples = users.slice(0, 5);
      for (const user of samples) {
        const newAvatarUrl = generateDiceBearAvatar(user.email);
        console.log(`   - ${user.full_name} (${user.email})`);
        console.log(`     Avatar: ${newAvatarUrl}\n`);
      }
    }
    
  } catch (error) {
    console.error('💥 Lỗi nghiêm trọng:', error);
  } finally {
    await pool.end();
  }
}

updateFakeUsersAvatar()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Lỗi:', error);
    process.exit(1);
  });
