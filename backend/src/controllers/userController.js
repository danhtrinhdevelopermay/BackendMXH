const pool = require('../config/database');

const getUserById = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    const userResult = await pool.queryAll(
      'SELECT id, username, email, full_name, avatar_url, bio, is_verified, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    const friendshipResult = await pool.queryAll(
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

const getUserStats = async (req, res) => {
  const { userId } = req.params;

  try {
    const [postsResult, friendsResult, photosResult] = await Promise.all([
      pool.queryAll('SELECT COUNT(*) FROM posts WHERE user_id = $1', [userId]),
      pool.queryAll(
        `SELECT COUNT(*) FROM friendships 
         WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)`,
        [userId]
      ),
      pool.queryAll(
        'SELECT COUNT(*) FROM posts WHERE user_id = $1 AND media_url IS NOT NULL',
        [userId]
      )
    ]);

    res.json({
      posts_count: parseInt(postsResult.rows[0].count),
      friends_count: parseInt(friendsResult.rows[0].count),
      photos_count: parseInt(photosResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getUserById, getUserStats };
