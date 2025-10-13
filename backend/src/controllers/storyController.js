const pool = require('../config/database');
const cloudinary = require('../config/cloudinary');

const createStory = async (req, res) => {
  const { media_type, caption } = req.body;
  const user_id = req.user.id;

  try {
    console.log('Creating story - User:', user_id, 'MediaType:', media_type);
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'Media file is required' });
    }

    console.log('File received:', req.file.size, 'bytes');

    const result = await new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: 'stories',
        resource_type: media_type === 'video' ? 'video' : 'image',
      };

      cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload success:', result.secure_url);
          resolve(result);
        }
      }).end(req.file.buffer);
    });

    console.log('Saving story to database...');
    const storyResult = await pool.query(
      `INSERT INTO stories (user_id, media_url, media_type, caption) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, result.secure_url, media_type, caption || null]
    );

    const story = storyResult.rows[0];
    console.log('Story saved with ID:', story.id);
    
    const storyWithUser = await pool.query(
      `SELECT s.*, u.username, u.full_name, u.avatar_url 
       FROM stories s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = $1`,
      [story.id]
    );

    console.log('Story created successfully');
    res.status(201).json(storyWithUser.rows[0]);
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllStories = async (req, res) => {
  const current_user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (s.user_id) s.*, u.username, u.full_name, u.avatar_url,
       (SELECT COUNT(*) FROM stories WHERE user_id = s.user_id AND expires_at > NOW()) as story_count
       FROM stories s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN friendships f ON 
         (f.requester_id = $1 AND f.addressee_id = s.user_id AND f.status = 'accepted') OR
         (f.addressee_id = $1 AND f.requester_id = s.user_id AND f.status = 'accepted')
       WHERE s.expires_at > NOW() 
       AND (s.user_id = $1 OR f.id IS NOT NULL)
       ORDER BY s.user_id, s.created_at DESC`,
      [current_user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get all stories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserStories = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT s.*, u.username, u.full_name, u.avatar_url
       FROM stories s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = $1 AND s.expires_at > NOW()
       ORDER BY s.created_at ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteStory = async (req, res) => {
  const { storyId } = req.params;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      'DELETE FROM stories WHERE id = $1 AND user_id = $2 RETURNING *',
      [storyId, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found or unauthorized' });
    }

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteExpiredStories = async () => {
  try {
    await pool.query('DELETE FROM stories WHERE expires_at <= NOW()');
    console.log('Expired stories deleted');
  } catch (error) {
    console.error('Delete expired stories error:', error);
  }
};

setInterval(deleteExpiredStories, 3600000);

module.exports = {
  createStory,
  getAllStories,
  getUserStories,
  deleteStory,
  deleteExpiredStories
};
