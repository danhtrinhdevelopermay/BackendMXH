const pool = require('../config/database');

const createPost = async (req, res) => {
  const { content, image_url } = req.body;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      'INSERT INTO posts (user_id, content, image_url) VALUES ($1, $2, $3) RETURNING *',
      [user_id, content, image_url]
    );

    const post = result.rows[0];
    
    const postWithUser = await pool.query(
      `SELECT p.*, u.username, u.full_name, u.avatar_url 
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.id = $1`,
      [post.id]
    );

    res.status(201).json(postWithUser.rows[0]);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getNewsFeed = async (req, res) => {
  const user_id = req.user.id;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await pool.query(
      `SELECT p.*, u.username, u.full_name, u.avatar_url,
       (SELECT COUNT(*) FROM reactions WHERE post_id = p.id) as reaction_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
       (SELECT reaction_type FROM reactions WHERE post_id = p.id AND user_id = $1) as user_reaction
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1 
       OR p.user_id IN (
         SELECT CASE 
           WHEN requester_id = $1 THEN addressee_id 
           ELSE requester_id 
         END 
         FROM friendships 
         WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)
       )
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [user_id, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get news feed error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserPosts = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT p.*, u.username, u.full_name, u.avatar_url,
       (SELECT COUNT(*) FROM reactions WHERE post_id = p.id) as reaction_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
       (SELECT reaction_type FROM reactions WHERE post_id = p.id AND user_id = $2) as user_reaction
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId, req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deletePost = async (req, res) => {
  const { postId } = req.params;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING *',
      [postId, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createPost, getNewsFeed, getUserPosts, deletePost };
