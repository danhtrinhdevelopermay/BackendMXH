const pool = require('../config/database');
const { sendPushNotification } = require('./pushTokenController');

const sendMessage = async (req, res) => {
  const { receiver_id, content } = req.body;
  const sender_id = req.user.id;

  try {
    if (content.trim() === '/love') {
      const existingRelationship = await pool.query(
        `SELECT * FROM relationships 
         WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
        [sender_id, receiver_id]
      );

      if (existingRelationship.rows.length > 0) {
        const rel = existingRelationship.rows[0];
        if (rel.status === 'pending') {
          return res.status(400).json({ error: 'Đã có lời mời hẹn hò đang chờ xử lý' });
        } else if (rel.status === 'accepted') {
          return res.status(400).json({ error: 'Bạn đã đang hẹn hò với người này rồi' });
        }
      }

      const user1_id = Math.min(sender_id, receiver_id);
      const user2_id = Math.max(sender_id, receiver_id);

      await pool.query(
        `INSERT INTO relationships (user1_id, user2_id, requester_id, status) 
         VALUES ($1, $2, $3, 'pending')`,
        [user1_id, user2_id, sender_id]
      );

      const messageContent = '💕 Lời mời hẹn hò';
      const result = await pool.query(
        'INSERT INTO messages (sender_id, receiver_id, content, message_type) VALUES ($1, $2, $3, $4) RETURNING *',
        [sender_id, receiver_id, messageContent, 'love_invitation']
      );

      await pool.query(
        `INSERT INTO notifications (user_id, type, content, related_user_id) 
         VALUES ($1, $2, $3, $4)`,
        [receiver_id, 'love_invitation', 'đã gửi lời mời hẹn hò cho bạn', sender_id]
      );

      const sender = await pool.query('SELECT full_name, username FROM users WHERE id = $1', [sender_id]);
      const senderName = sender.rows[0]?.full_name || sender.rows[0]?.username || 'Someone';
      
      await sendPushNotification(
        receiver_id,
        '💕 Lời mời hẹn hò',
        `${senderName} muốn hẹn hò với bạn`,
        { screen: 'Chat', userId: sender_id, userName: senderName }
      );

      return res.status(201).json(result.rows[0]);
    }

    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [sender_id, receiver_id, content]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, content, related_user_id) 
       VALUES ($1, $2, $3, $4)`,
      [receiver_id, 'message', 'sent you a message', sender_id]
    );

    const sender = await pool.query('SELECT full_name, username FROM users WHERE id = $1', [sender_id]);
    const senderName = sender.rows[0]?.full_name || sender.rows[0]?.username || 'Someone';
    
    await sendPushNotification(
      receiver_id,
      'Tin nhắn mới',
      `${senderName}: ${content}`,
      { screen: 'Chat', userId: sender_id, userName: senderName }
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getConversations = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
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

    res.json(result.rows);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMessages = async (req, res) => {
  const { userId } = req.params;
  const current_user_id = req.user.id;

  try {
    const result = await pool.query(
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
