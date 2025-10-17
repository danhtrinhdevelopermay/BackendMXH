const pool = require('../config/database');
const { sendPushNotification } = require('./pushTokenController');

const acceptRelationship = async (req, res) => {
  const { sender_id } = req.body;
  const receiver_id = req.user.id;

  try {
    const user1_id = Math.min(sender_id, receiver_id);
    const user2_id = Math.max(sender_id, receiver_id);

    const relationshipResult = await pool.query(
      `UPDATE relationships 
       SET status = 'accepted', updated_at = CURRENT_TIMESTAMP 
       WHERE user1_id = $1 AND user2_id = $2 AND requester_id = $3 AND status = 'pending'
       RETURNING *`,
      [user1_id, user2_id, sender_id]
    );

    if (relationshipResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy lời mời hẹn hò' });
    }

    const [user1, user2] = await Promise.all([
      pool.query('SELECT id, username, full_name FROM users WHERE id = $1', [sender_id]),
      pool.query('SELECT id, username, full_name FROM users WHERE id = $1', [receiver_id])
    ]);

    const user1Name = user1.rows[0]?.full_name || user1.rows[0]?.username;
    const user2Name = user2.rows[0]?.full_name || user2.rows[0]?.username;
    const relationshipId = relationshipResult.rows[0].id;

    const relationshipPost = `đang hẹn hò với ${user2Name}`;
    await pool.query(
      `INSERT INTO posts (user_id, content, privacy, post_type, relationship_id) 
       VALUES ($1, $2, 'public', 'relationship', $3)`,
      [sender_id, relationshipPost, relationshipId]
    );

    const relationshipPost2 = `đang hẹn hò với ${user1Name}`;
    await pool.query(
      `INSERT INTO posts (user_id, content, privacy, post_type, relationship_id) 
       VALUES ($1, $2, 'public', 'relationship', $3)`,
      [receiver_id, relationshipPost2, relationshipId]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, content, related_user_id) 
       VALUES ($1, $2, $3, $4)`,
      [sender_id, 'love_accepted', 'đã chấp nhận hẹn hò với bạn', receiver_id]
    );

    await sendPushNotification(
      sender_id,
      '💕 Hẹn hò',
      `${user2Name} đã chấp nhận hẹn hò với bạn`,
      { screen: 'Profile', userId: receiver_id }
    );

    res.json(relationshipResult.rows[0]);
  } catch (error) {
    console.error('Accept relationship error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const rejectRelationship = async (req, res) => {
  const { sender_id } = req.body;
  const receiver_id = req.user.id;

  try {
    const user1_id = Math.min(sender_id, receiver_id);
    const user2_id = Math.max(sender_id, receiver_id);

    const result = await pool.query(
      `DELETE FROM relationships 
       WHERE user1_id = $1 AND user2_id = $2 AND requester_id = $3 AND status = 'pending'
       RETURNING *`,
      [user1_id, user2_id, sender_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy lời mời hẹn hò' });
    }

    res.json({ message: 'Đã từ chối lời mời hẹn hò' });
  } catch (error) {
    console.error('Reject relationship error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const cancelRelationship = async (req, res) => {
  const { partner_id } = req.body;
  const user_id = req.user.id;

  try {
    const user1_id = Math.min(user_id, partner_id);
    const user2_id = Math.max(user_id, partner_id);

    const result = await pool.query(
      `DELETE FROM relationships 
       WHERE user1_id = $1 AND user2_id = $2 AND status = 'accepted'
       RETURNING *`,
      [user1_id, user2_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy mối quan hệ' });
    }

    const relationshipId = result.rows[0].id;

    await pool.query(
      `DELETE FROM posts 
       WHERE relationship_id = $1`,
      [relationshipId]
    );

    const [user1, user2] = await Promise.all([
      pool.query('SELECT full_name, username FROM users WHERE id = $1', [user_id]),
      pool.query('SELECT full_name, username FROM users WHERE id = $1', [partner_id])
    ]);

    const userName = user1.rows[0]?.full_name || user1.rows[0]?.username;

    await pool.query(
      `INSERT INTO notifications (user_id, type, content, related_user_id) 
       VALUES ($1, $2, $3, $4)`,
      [partner_id, 'relationship_ended', 'đã kết thúc mối quan hệ với bạn', user_id]
    );

    await sendPushNotification(
      partner_id,
      '💔 Hẹn hò',
      `${userName} đã kết thúc mối quan hệ`,
      { screen: 'Profile', userId: user_id }
    );

    res.json({ message: 'Đã kết thúc mối quan hệ' });
  } catch (error) {
    console.error('Cancel relationship error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getRelationshipStatus = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    const user1_id = Math.min(currentUserId, userId);
    const user2_id = Math.max(currentUserId, userId);

    const result = await pool.query(
      `SELECT * FROM relationships 
       WHERE user1_id = $1 AND user2_id = $2`,
      [user1_id, user2_id]
    );

    if (result.rows.length === 0) {
      return res.json({ status: 'none' });
    }

    const relationship = result.rows[0];
    let status = relationship.status;
    
    if (relationship.status === 'pending') {
      if (relationship.requester_id === parseInt(currentUserId)) {
        status = 'request_sent';
      } else {
        status = 'request_received';
      }
    }

    res.json({ 
      status, 
      requester_id: relationship.requester_id,
      created_at: relationship.created_at 
    });
  } catch (error) {
    console.error('Get relationship status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { 
  acceptRelationship, 
  rejectRelationship, 
  cancelRelationship, 
  getRelationshipStatus 
};
