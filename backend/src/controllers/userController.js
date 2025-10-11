const pool = require('../config/database');

const getUserById = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    const userResult = await pool.query(
      'SELECT id, username, email, full_name, avatar_url, bio, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    const friendshipResult = await pool.query(
      `SELECT id, status, requester_id, addressee_id 
       FROM friendships 
       WHERE (requester_id = $1 AND addressee_id = $2) 
          OR (requester_id = $2 AND addressee_id = $1)`,
      [currentUserId, userId]
    );

    let friendshipStatus = null;
    let friendshipId = null;

    if (friendshipResult.rows.length > 0) {
      const friendship = friendshipResult.rows[0];
      friendshipId = friendship.id;
      
      if (friendship.status === 'accepted') {
        friendshipStatus = 'friends';
      } else if (friendship.status === 'pending') {
        if (friendship.requester_id === parseInt(currentUserId)) {
          friendshipStatus = 'request_sent';
        } else {
          friendshipStatus = 'request_received';
        }
      }
    }

    res.json({
      ...user,
      friendship_status: friendshipStatus,
      friendship_id: friendshipId
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getUserById };
