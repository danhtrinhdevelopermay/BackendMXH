const pool = require('../config/database');
const cacheService = require('../services/cache');
const { sendPushNotification } = require('./pushTokenController');

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
      cacheService.delPattern('likedposts:');
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
      const reactionTexts = {
        'like': 'thích',
        'love': 'yêu thích',
        'haha': 'thấy buồn cười',
        'wow': 'ngạc nhiên',
        'sad': 'thấy buồn',
        'angry': 'tức giận'
      };
      const reactionText = reactionTexts[reaction_type] || 'bày tỏ cảm xúc';
      
      await pool.query(
        `INSERT INTO notifications (user_id, type, content, related_user_id, related_post_id) 
         VALUES ($1, $2, $3, $4, $5)`,
        [postOwner.rows[0].user_id, 'reaction', `đã ${reactionText} bài viết của bạn`, user_id, postId]
      );

      const reactor = await pool.query('SELECT full_name, username FROM users WHERE id = $1', [user_id]);
      const reactorName = reactor.rows[0]?.full_name || reactor.rows[0]?.username || 'Someone';
      
      const reactionEmojis = {
        'like': '👍',
        'love': '❤️',
        'haha': '😂',
        'wow': '😮',
        'sad': '😢',
        'angry': '😡'
      };
      const emoji = reactionEmojis[reaction_type] || '👍';
      
      await sendPushNotification(
        postOwner.rows[0].user_id,
        'Cảm xúc mới',
        `${reactorName} đã bày tỏ cảm xúc ${emoji} về bài viết của bạn`,
        { screen: 'PostDetail', postId: parseInt(postId) }
      );
    }

    cacheService.delPattern('newsfeed:');
    cacheService.delPattern('userposts:');
    cacheService.delPattern('likedposts:');
    
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
    cacheService.delPattern('likedposts:');

    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getReactions = async (req, res) => {
  const { postId } = req.params;

  try {
    const [reactionsResult, summaryResult] = await Promise.all([
      pool.queryAll(
        `SELECT r.*, u.username, u.full_name, u.avatar_url, u.is_verified
         FROM reactions r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.post_id = $1
         ORDER BY r.created_at DESC`,
        [postId]
      ),
      pool.queryAll(
        `SELECT reaction_type, COUNT(*) as count
         FROM reactions
         WHERE post_id = $1
         GROUP BY reaction_type
         ORDER BY count DESC`,
        [postId]
      )
    ]);

    res.json({
      reactions: reactionsResult.rows,
      summary: summaryResult.rows
    });
  } catch (error) {
    console.error('Get reactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { addReaction, removeReaction, getReactions };
