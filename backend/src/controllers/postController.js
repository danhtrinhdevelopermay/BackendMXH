const pool = require('../config/database');
const cacheService = require('../services/cache');

const createPost = async (req, res) => {
  const { content, media_id, privacy = 'public' } = req.body;
  const user_id = req.user.id;

  if (privacy && !['public', 'friends'].includes(privacy)) {
    return res.status(400).json({ error: 'Invalid privacy value. Must be "public" or "friends"' });
  }

  try {
    console.log(`Creating post for user ${user_id}, media_id: ${media_id}, content: "${content}", privacy: ${privacy}`);
    let result;
    
    if (media_id) {
      console.log(`Updating existing post (media_id: ${media_id}) with content and privacy`);
      result = await pool.query(
        'UPDATE posts SET content = $1, privacy = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
        [content, privacy, media_id, user_id]
      );
      
      if (result.rows.length === 0) {
        console.log(`Media not found or unauthorized - media_id: ${media_id}, user_id: ${user_id}`);
        return res.status(404).json({ error: 'Media not found or unauthorized' });
      }
      console.log(`Post updated successfully - ID: ${result.rows[0].id}`);
    } else {
      console.log('Creating new post without media');
      result = await pool.query(
        'INSERT INTO posts (user_id, content, privacy) VALUES ($1, $2, $3) RETURNING *',
        [user_id, content, privacy]
      );
      console.log(`Post created successfully - ID: ${result.rows[0].id}`);
    }

    const post = result.rows[0];
    
    const postWithUser = await pool.query(
      `SELECT p.id, p.user_id, p.content, p.media_url, p.media_type, p.privacy, p.created_at, p.updated_at,
       u.username, u.full_name, u.avatar_url, u.is_verified 
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.id = $1`,
      [post.id]
    );

    console.log(`Returning post with media_type: ${postWithUser.rows[0].media_type}`);
    
    cacheService.delPattern('newsfeed:');
    cacheService.delPattern('userposts:');
    
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

  const cacheKey = cacheService.getCacheKey('newsfeed', user_id, limit, offset);

  try {
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const result = await pool.query(
      `WITH friend_ids AS (
         SELECT CASE 
           WHEN requester_id = $1 THEN addressee_id 
           ELSE requester_id 
         END as friend_id
         FROM friendships 
         WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)
       ),
       visible_posts AS (
         SELECT p.id, p.user_id, p.content, p.media_url, p.media_type, p.privacy, p.created_at, p.updated_at
         FROM posts p
         WHERE (
           p.user_id = $1 
           OR p.privacy = 'public'
           OR (p.privacy = 'friends' AND p.user_id IN (SELECT friend_id FROM friend_ids))
         )
         ORDER BY p.created_at DESC
         LIMIT $2 OFFSET $3
       ),
       reaction_counts AS (
         SELECT post_id, COUNT(*) as count
         FROM reactions
         WHERE post_id IN (SELECT id FROM visible_posts)
         GROUP BY post_id
       ),
       comment_counts AS (
         SELECT post_id, COUNT(*) as count
         FROM comments
         WHERE post_id IN (SELECT id FROM visible_posts)
         GROUP BY post_id
       ),
       user_reactions AS (
         SELECT post_id, reaction_type
         FROM reactions
         WHERE user_id = $1 AND post_id IN (SELECT id FROM visible_posts)
       )
       SELECT p.id, p.user_id, p.content, p.media_url, p.media_type, p.privacy, p.created_at, p.updated_at,
         u.username, u.full_name, u.avatar_url, u.is_verified,
         COALESCE(rc.count, 0) as reaction_count,
         COALESCE(cc.count, 0) as comment_count,
         ur.reaction_type as user_reaction
       FROM visible_posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN reaction_counts rc ON rc.post_id = p.id
       LEFT JOIN comment_counts cc ON cc.post_id = p.id
       LEFT JOIN user_reactions ur ON ur.post_id = p.id
       ORDER BY p.created_at DESC`,
      [user_id, limit, offset]
    );

    const responseData = { posts: result.rows };
    cacheService.set(cacheKey, responseData, 180);
    res.json(responseData);
  } catch (error) {
    console.error('Get news feed error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserPosts = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  const cacheKey = cacheService.getCacheKey('userposts', userId, currentUserId);

  try {
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const result = await pool.query(
      `WITH visible_posts AS (
         SELECT p.id, p.user_id, p.content, p.media_url, p.media_type, p.privacy, p.created_at, p.updated_at
         FROM posts p
         WHERE p.user_id = $1 AND (
           $1 = $2
           OR p.privacy = 'public'
           OR (p.privacy = 'friends' AND EXISTS (
             SELECT 1 FROM friendships 
             WHERE status = 'accepted' 
             AND ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))
           ))
         )
         ORDER BY p.created_at DESC
       ),
       reaction_counts AS (
         SELECT post_id, COUNT(*) as count
         FROM reactions
         WHERE post_id IN (SELECT id FROM visible_posts)
         GROUP BY post_id
       ),
       comment_counts AS (
         SELECT post_id, COUNT(*) as count
         FROM comments
         WHERE post_id IN (SELECT id FROM visible_posts)
         GROUP BY post_id
       ),
       user_reactions AS (
         SELECT post_id, reaction_type
         FROM reactions
         WHERE user_id = $2 AND post_id IN (SELECT id FROM visible_posts)
       )
       SELECT p.id, p.user_id, p.content, p.media_url, p.media_type, p.privacy, p.created_at, p.updated_at,
         u.username, u.full_name, u.avatar_url, u.is_verified,
         COALESCE(rc.count, 0) as reaction_count,
         COALESCE(cc.count, 0) as comment_count,
         ur.reaction_type as user_reaction
       FROM visible_posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN reaction_counts rc ON rc.post_id = p.id
       LEFT JOIN comment_counts cc ON cc.post_id = p.id
       LEFT JOIN user_reactions ur ON ur.post_id = p.id
       ORDER BY p.created_at DESC`,
      [userId, currentUserId]
    );

    const responseData = { posts: result.rows };
    cacheService.set(cacheKey, responseData, 180);
    res.json(responseData);
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

    cacheService.delPattern('newsfeed:');
    cacheService.delPattern('userposts:');

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const searchPosts = async (req, res) => {
  const { query } = req.query;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT p.id, p.user_id, p.content, p.media_url, p.media_type, p.privacy, p.created_at, p.updated_at,
       u.username, u.full_name as author_name, u.avatar_url,
       (SELECT COUNT(*) FROM reactions WHERE post_id = p.id) as reaction_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.content ILIKE $1 AND (
         p.user_id = $2
         OR p.privacy = 'public'
         OR (p.privacy = 'friends' AND p.user_id IN (
           SELECT CASE 
             WHEN requester_id = $2 THEN addressee_id 
             ELSE requester_id 
           END 
           FROM friendships 
           WHERE status = 'accepted' AND (requester_id = $2 OR addressee_id = $2)
         ))
       )
       ORDER BY p.created_at DESC
       LIMIT 30`,
      [`%${query}%`, user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createPost, getNewsFeed, getUserPosts, deletePost, searchPosts };
