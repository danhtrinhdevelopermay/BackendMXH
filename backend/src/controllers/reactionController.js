const pool = require('../config/database');
const cacheService = require('../services/cache');

const addReaction = async (req, res) => {
  const { postId } = req.params;
  const { reaction_type } = req.body;
  const user_id = req.user.id;

  try {
    const existing = await pool.query(
      'SELECT * FROM reactions WHERE post_id = $1 AND user_id = $2',
      [postId, user_id]
    );

    if (existing.rows.length > 0) {
      const result = await pool.query(
        'UPDATE reactions SET reaction_type = $1 WHERE post_id = $2 AND user_id = $3 RETURNING *',
        [reaction_type, postId, user_id]
      );
      cacheService.delPattern('newsfeed:');
      cacheService.delPattern('userposts:');
      return res.json(result.rows[0]);
    }

    const result = await pool.query(
      'INSERT INTO reactions (post_id, user_id, reaction_type) VALUES ($1, $2, $3) RETURNING *',
      [postId, user_id, reaction_type]
    );

    const postOwner = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (postOwner.rows[0] && postOwner.rows[0].user_id !== user_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, content, related_user_id, related_post_id) 
         VALUES ($1, $2, $3, $4, $5)`,
        [postOwner.rows[0].user_id, 'reaction', `reacted ${reaction_type} to your post`, user_id, postId]
      );
    }

    cacheService.delPattern('newsfeed:');
    cacheService.delPattern('userposts:');
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const removeReaction = async (req, res) => {
  const { postId } = req.params;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      'DELETE FROM reactions WHERE post_id = $1 AND user_id = $2 RETURNING *',
      [postId, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reaction not found' });
    }

    cacheService.delPattern('newsfeed:');
    cacheService.delPattern('userposts:');

    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getReactions = async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await pool.query(
      `SELECT r.*, u.username, u.full_name, u.avatar_url 
       FROM reactions r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.post_id = $1`,
      [postId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get reactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { addReaction, removeReaction, getReactions };
