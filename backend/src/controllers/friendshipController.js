const pool = require('../config/database');

const sendFriendRequest = async (req, res) => {
  const { addressee_id } = req.body;
  const requester_id = req.user.id;

  if (requester_id === addressee_id) {
    return res.status(400).json({ error: 'Cannot send friend request to yourself' });
  }

  try {
    const existing = await pool.query(
      'SELECT * FROM friendships WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)',
      [requester_id, addressee_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }

    const result = await pool.query(
      'INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, $3) RETURNING *',
      [requester_id, addressee_id, 'pending']
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, content, related_user_id) 
       VALUES ($1, $2, $3, $4)`,
      [addressee_id, 'friend_request', 'gửi một yêu cầu kết bạn đến bạn', requester_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const respondToFriendRequest = async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;
  const user_id = req.user.id;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      'UPDATE friendships SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND addressee_id = $3 RETURNING *',
      [status, requestId, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (status === 'accepted') {
      await pool.query(
        `INSERT INTO notifications (user_id, type, content, related_user_id) 
         VALUES ($1, $2, $3, $4)`,
        [result.rows[0].requester_id, 'friend_accept', 'accepted your friend request', user_id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Respond to friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getFriends = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio 
       FROM users u 
       JOIN friendships f ON (f.requester_id = u.id OR f.addressee_id = u.id) 
       WHERE f.status = 'accepted' 
       AND (f.requester_id = $1 OR f.addressee_id = $1) 
       AND u.id != $1`,
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getFriendRequests = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT f.id as request_id, u.id as user_id, u.username, u.full_name, u.avatar_url, f.created_at 
       FROM friendships f 
       JOIN users u ON f.requester_id = u.id 
       WHERE f.addressee_id = $1 AND f.status = 'pending' 
       ORDER BY f.created_at DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const searchUsers = async (req, res) => {
  const { query } = req.query;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, username, full_name, avatar_url, bio 
       FROM users 
       WHERE (username ILIKE $1 OR full_name ILIKE $1) AND id != $2 
       LIMIT 20`,
      [`%${query}%`, user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { sendFriendRequest, respondToFriendRequest, getFriends, getFriendRequests, searchUsers };
