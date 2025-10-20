const pool = require('../config/database');
const { sendPushNotification } = require('./pushTokenController');
const { updateStreak } = require('./streakController');

const sendMessage = async (req, res) => {
  const { receiver_id, content } = req.body;
  const sender_id = req.user.id;

  try {
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [sender_id, receiver_id, content]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, content, related_user_id) 
       VALUES ($1, $2, $3, $4)`,
      [receiver_id, 'message', 'đã gửi tin nhắn cho bạn', sender_id]
    );

    const sender = await pool.query('SELECT full_name, username FROM users WHERE id = $1', [sender_id]);
    const senderName = sender.rows[0]?.full_name || sender.rows[0]?.username || 'Someone';
    
    await sendPushNotification(
      receiver_id,
      'Tin nhắn mới',
      `${senderName}: ${content}`,
      { screen: 'Chat', userId: sender_id, userName: senderName }
    );

    // Update streak
    const streakResult = await updateStreak(sender_id, receiver_id);
    console.log(`[MESSAGE] Streak update result:`, streakResult);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getConversations = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.queryAll(
      `SELECT DISTINCT ON (other_user_id) 
       other_user_id, username, full_name, avatar_url, 
       last_message, last_message_time, is_read
       FROM (
         SELECT 
           CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user_id,
           u.username, u.full_name, u.avatar_url,
           m.content as last_message,
           m.created_at as last_message_time,
           m.is_read,
           m.sender_id
         FROM messages m
         JOIN users u ON (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END = u.id)
         WHERE sender_id = $1 OR receiver_id = $1
         ORDER BY other_user_id, m.created_at DESC
       ) conversations
       ORDER BY other_user_id, last_message_time DESC`,
      [user_id]
    );

    // Get streaks for each conversation
    const conversationsWithStreaks = await Promise.all(
      result.rows.map(async (conversation) => {
        const orderUserIds = (userId1, userId2) => {
          return userId1 < userId2 
            ? { user_id_1: userId1, user_id_2: userId2 }
            : { user_id_1: userId2, user_id_2: userId1 };
        };

        const { user_id_1, user_id_2 } = orderUserIds(user_id, conversation.other_user_id);
        
        const streakResult = await pool.queryAll(
          `SELECT streak_count, last_interaction_date 
           FROM message_streaks 
           WHERE user_id_1 = $1 AND user_id_2 = $2`,
          [user_id_1, user_id_2]
        );

        let streak_count = 0;
        if (streakResult.rows.length > 0) {
          const lastDate = new Date(streakResult.rows[0].last_interaction_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          lastDate.setHours(0, 0, 0, 0);
          
          const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 1) {
            streak_count = streakResult.rows[0].streak_count;
          }
        }

        return {
          ...conversation,
          streak_count
        };
      })
    );

    res.json(conversationsWithStreaks);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMessages = async (req, res) => {
  const { userId } = req.params;
  const current_user_id = req.user.id;

  try {
    const result = await pool.queryAll(
      `SELECT m.*, 
       sender.username as sender_username, sender.avatar_url as sender_avatar,
       receiver.username as receiver_username, receiver.avatar_url as receiver_avatar
       FROM messages m
       JOIN users sender ON m.sender_id = sender.id
       JOIN users receiver ON m.receiver_id = receiver.id
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [current_user_id, userId]
    );

    await pool.query(
      'UPDATE messages SET is_read = TRUE WHERE sender_id = $1 AND receiver_id = $2',
      [userId, current_user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { sendMessage, getConversations, getMessages };
