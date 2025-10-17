const pool = require('../config/database');
const { sendPushNotification } = require('./pushTokenController');

const addMessageReaction = async (req, res) => {
  const { messageId } = req.params;
  const { reaction_type } = req.body;
  const user_id = req.user.id;

  try {
    const existing = await pool.query(
      'SELECT * FROM message_reactions WHERE message_id = $1 AND user_id = $2',
      [messageId, user_id]
    );

    if (existing.rows.length > 0) {
      const result = await pool.query(
        'UPDATE message_reactions SET reaction_type = $1 WHERE message_id = $2 AND user_id = $3 RETURNING *',
        [reaction_type, messageId, user_id]
      );
      return res.json(result.rows[0]);
    }

    const result = await pool.query(
      'INSERT INTO message_reactions (message_id, user_id, reaction_type) VALUES ($1, $2, $3) RETURNING *',
      [messageId, user_id, reaction_type]
    );

    const message = await pool.query(
      'SELECT sender_id, receiver_id FROM messages WHERE id = $1',
      [messageId]
    );

    if (message.rows[0]) {
      const messageOwnerId = message.rows[0].sender_id === user_id 
        ? message.rows[0].receiver_id 
        : message.rows[0].sender_id;

      if (messageOwnerId !== user_id) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, content, related_user_id) 
           VALUES ($1, $2, $3, $4)`,
          [messageOwnerId, 'message_reaction', `reacted ${reaction_type} to your message`, user_id]
        );

        const reactor = await pool.query('SELECT full_name, username FROM users WHERE id = $1', [user_id]);
        const reactorName = reactor.rows[0]?.full_name || reactor.rows[0]?.username || 'Someone';
        
        await sendPushNotification(
          messageOwnerId,
          'Cảm xúc mới',
          `${reactorName} đã bày tỏ cảm xúc về tin nhắn của bạn`,
          { screen: 'Chat', userId: user_id, userName: reactorName }
        );
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add message reaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const removeMessageReaction = async (req, res) => {
  const { messageId } = req.params;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 RETURNING *',
      [messageId, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reaction not found' });
    }

    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    console.error('Remove message reaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMessageReactions = async (req, res) => {
  const { messageId } = req.params;

  try {
    const result = await pool.query(
      `SELECT mr.*, u.username, u.full_name, u.avatar_url
       FROM message_reactions mr
       JOIN users u ON mr.user_id = u.id
       WHERE mr.message_id = $1
       ORDER BY mr.created_at DESC`,
      [messageId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get message reactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { addMessageReaction, removeMessageReaction, getMessageReactions };
