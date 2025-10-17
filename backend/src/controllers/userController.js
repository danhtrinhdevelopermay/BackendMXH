const pool = require('../config/database');

const getUserById = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    const userResult = await pool.query(
      'SELECT id, username, email, full_name, avatar_url, bio, is_verified, is_pro, created_at FROM users WHERE id = $1',
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

    const user1_id = Math.min(currentUserId, userId);
    const user2_id = Math.max(currentUserId, userId);

    const relationshipResult = await pool.query(
      `SELECT r.*, u.id as partner_id, u.username as partner_username, u.full_name as partner_name, u.avatar_url as partner_avatar
       FROM relationships r
       JOIN users u ON (CASE WHEN r.user1_id = $1 THEN r.user2_id ELSE r.user1_id END = u.id)
       WHERE r.user1_id = $2 AND r.user2_id = $3`,
      [currentUserId, user1_id, user2_id]
    );

    let relationshipStatus = null;
    let relationshipData = null;

    if (relationshipResult.rows.length > 0) {
      const relationship = relationshipResult.rows[0];
      
      if (relationship.status === 'accepted') {
        relationshipStatus = 'dating';
        relationshipData = {
          partner_id: relationship.partner_id,
          partner_username: relationship.partner_username,
          partner_name: relationship.partner_name,
          partner_avatar: relationship.partner_avatar,
          since: relationship.created_at
        };
      } else if (relationship.status === 'pending') {
        if (relationship.requester_id === parseInt(currentUserId)) {
          relationshipStatus = 'love_request_sent';
        } else {
          relationshipStatus = 'love_request_received';
        }
      }
    }

    res.json({
      ...user,
      friendship_status: friendshipStatus,
      friendship_id: friendshipId,
      relationship_status: relationshipStatus,
      relationship: relationshipData
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
      pool.query('SELECT COUNT(*) FROM posts WHERE user_id = $1', [userId]),
      pool.query(
        `SELECT COUNT(*) FROM friendships 
         WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)`,
        [userId]
      ),
      pool.query(
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
