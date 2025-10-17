const pool = require('../src/config/database');

const loveComments = [
  '❤️❤️❤️',
  '💕 Yêu quá!',
  '💖 Tuyệt vời!',
  '😍 Đẹp quá đi!',
  '💗💗💗 Love it!',
  '💝 Amazing!',
  '💓 So sweet!',
  '💞 Beautiful!',
  '💘 Adorable!',
  '❣️ Perfect!',
  '💕💕💕 Lovely!',
  '🥰 Cute!',
  '😘💕',
  '💖✨ Gorgeous!'
];

async function seedPostInteractions() {
  const client = await pool.connect();
  
  try {
    console.log('💖 Bắt đầu tạo dữ liệu tương tác cho bài viết...');
    
    const postId = 16;
    const numberOfReactions = 75;
    const numberOfComments = 14;
    
    const post = await client.query('SELECT * FROM posts WHERE id = $1', [postId]);
    if (post.rows.length === 0) {
      console.error('❌ Không tìm thấy bài viết với ID:', postId);
      return;
    }
    
    console.log(`✅ Tìm thấy bài viết ID ${postId}`);
    
    const friendsResult = await client.query(
      `SELECT DISTINCT u.id 
       FROM users u 
       JOIN friendships f ON (f.addressee_id = u.id OR f.requester_id = u.id)
       WHERE (f.requester_id = $1 OR f.addressee_id = $1) 
       AND f.status = 'accepted' 
       AND u.id != $1
       LIMIT $2`,
      [post.rows[0].user_id, numberOfReactions]
    );
    
    const friendIds = friendsResult.rows.map(row => row.id);
    
    if (friendIds.length < numberOfReactions) {
      console.warn(`⚠️  Chỉ có ${friendIds.length} bạn bè, cần ${numberOfReactions} người để react`);
    }
    
    console.log(`\n👍 Tạo ${numberOfReactions} reactions...`);
    
    const reactionTypes = ['love', 'love', 'love', 'love', 'like', 'like', 'haha', 'wow'];
    let reactionsCreated = 0;
    
    for (let i = 0; i < Math.min(numberOfReactions, friendIds.length); i++) {
      const userId = friendIds[i];
      const reactionType = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];
      
      try {
        await client.query(
          `INSERT INTO reactions (post_id, user_id, reaction_type, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (post_id, user_id) DO NOTHING`,
          [postId, userId, reactionType]
        );
        
        reactionsCreated++;
        
        if ((i + 1) % 15 === 0) {
          console.log(`   ✓ Đã tạo ${i + 1}/${numberOfReactions} reactions...`);
        }
      } catch (error) {
        console.error(`   ⚠️  Lỗi khi tạo reaction:`, error.message);
      }
    }
    
    console.log(`\n💬 Tạo ${numberOfComments} comments về chủ đề yêu thương...`);
    
    let commentsCreated = 0;
    
    for (let i = 0; i < numberOfComments && i < friendIds.length; i++) {
      const userId = friendIds[i];
      const commentContent = loveComments[i % loveComments.length];
      
      try {
        await client.query(
          `INSERT INTO comments (post_id, user_id, content, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [postId, userId, commentContent]
        );
        
        commentsCreated++;
        
        if ((i + 1) % 5 === 0) {
          console.log(`   ✓ Đã tạo ${i + 1}/${numberOfComments} comments...`);
        }
      } catch (error) {
        console.error(`   ⚠️  Lỗi khi tạo comment:`, error.message);
      }
    }
    
    const reactionCount = await client.query(
      'SELECT COUNT(*) as count FROM reactions WHERE post_id = $1',
      [postId]
    );
    
    const commentCount = await client.query(
      'SELECT COUNT(*) as count FROM comments WHERE post_id = $1',
      [postId]
    );
    
    const reactionStats = await client.query(
      `SELECT reaction_type, COUNT(*) as count 
       FROM reactions 
       WHERE post_id = $1 
       GROUP BY reaction_type 
       ORDER BY count DESC`,
      [postId]
    );
    
    console.log(`\n✅ Hoàn thành!`);
    console.log(`📊 Thống kê bài viết ID ${postId}:`);
    console.log(`   - Tổng reactions: ${reactionCount.rows[0].count}`);
    console.log(`   - Tổng comments: ${commentCount.rows[0].count}`);
    console.log(`\n💖 Phân loại reactions:`);
    reactionStats.rows.forEach(stat => {
      console.log(`   - ${stat.reaction_type}: ${stat.count}`);
    });
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedPostInteractions();
