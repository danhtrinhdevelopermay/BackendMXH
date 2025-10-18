const pool = require('../config/database');
const cacheService = require('../services/cache');
const { sendPushNotification } = require('./pushTokenController');

const addComment = async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `INSERT INTO comments (post_id, user_id, content) 
       VALUES ($1, $2, $3) RETURNING *`,
      [postId, user_id, content]
    );

    const comment = result.rows[0];
    
    const commentWithUser = await pool.query(
      `SELECT c.*, u.username, u.full_name, u.avatar_url 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = $1`,
      [comment.id]
    );

    const postOwner = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (postOwner.rows[0] && postOwner.rows[0].user_id !== user_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, content, related_user_id, related_post_id) 
         VALUES ($1, $2, $3, $4, $5)`,
        [postOwner.rows[0].user_id, 'comment', 'commented on your post', user_id, postId]
      );

      const commenter = await pool.query('SELECT full_name, username FROM users WHERE id = $1', [user_id]);
      const commenterName = commenter.rows[0]?.full_name || commenter.rows[0]?.username || 'Someone';
      
      await sendPushNotification(
        postOwner.rows[0].user_id,
        'Bình luận mới',
        `${commenterName} đã bình luận về bài viết của bạn`,
        { screen: 'PostDetail', postId: parseInt(postId) }
      );
    }

    cacheService.delPattern('newsfeed:');
    cacheService.delPattern('userposts:');
    
    res.status(201).json(commentWithUser.rows[0]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getComments = async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await pool.query(
      `SELECT c.*, u.username, u.full_name, u.avatar_url 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.post_id = $1 
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING *',
      [commentId, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    cacheService.delPattern('newsfeed:');
    cacheService.delPattern('userposts:');

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { addComment, getComments, deleteComment };
