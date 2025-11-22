const db = require('../config/database');
const axios = require('axios');

// Get reels (video posts from database)
exports.getReels = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    // Get video posts from database
    const videoPosts = await db.query(
      `SELECT 
        p.*,
        u.username,
        u.full_name,
        u.is_verified,
        (SELECT COUNT(*) FROM reactions WHERE post_id = p.id) as reaction_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT reaction_type FROM reactions WHERE post_id = p.id AND user_id = $1) as user_reaction,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'full_name', u.full_name,
          'is_verified', u.is_verified
        ) as user
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.media_type LIKE 'video%'
      AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json(videoPosts.rows);
  } catch (error) {
    console.error('Error fetching reels:', error);
    res.status(500).json({ error: 'Failed to fetch reels' });
  }
};

// Get TikTok videos using TikTok Display API
exports.getTikTokVideos = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Check if TikTok API credentials are configured
    const tiktokAccessToken = process.env.TIKTOK_ACCESS_TOKEN;
    
    if (!tiktokAccessToken) {
      return res.status(400).json({ 
        error: 'TikTok API credentials not configured',
        message: 'Please set TIKTOK_ACCESS_TOKEN in environment variables'
      });
    }

    // TikTok Display API endpoint for user videos
    const tiktokApiUrl = 'https://open.tiktokapis.com/v2/video/list/';
    
    // Make request to TikTok API
    const response = await axios.post(
      tiktokApiUrl,
      {
        max_count: parseInt(limit),
      },
      {
        headers: {
          'Authorization': `Bearer ${tiktokAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.data) {
      // Transform TikTok data to match our schema
      const tiktokVideos = response.data.data.videos.map(video => ({
        id: `tiktok_${video.id}`,
        source: 'tiktok',
        media_url: video.cover_image_url,
        video_url: video.share_url,
        caption: video.title || video.video_description,
        user: {
          username: video.username || 'TikTok User',
          full_name: video.username || 'TikTok User',
          is_verified: false,
        },
        reaction_count: video.like_count || 0,
        comment_count: video.comment_count || 0,
        share_count: video.share_count || 0,
        view_count: video.view_count || 0,
        created_at: video.create_time,
      }));

      res.json(tiktokVideos);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching TikTok videos:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid TikTok API credentials',
        message: 'Please check your TIKTOK_ACCESS_TOKEN'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch TikTok videos',
      message: error.message 
    });
  }
};

// Get combined reels (database + TikTok)
exports.getCombinedReels = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    // Get video posts from database
    const videoPosts = await db.query(
      `SELECT 
        p.*,
        u.username,
        u.full_name,
        u.is_verified,
        (SELECT COUNT(*) FROM reactions WHERE post_id = p.id) as reaction_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT reaction_type FROM reactions WHERE post_id = p.id AND user_id = $1) as user_reaction,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'full_name', u.full_name,
          'is_verified', u.is_verified
        ) as user
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.media_type LIKE 'video%'
      AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC
      LIMIT $2`,
      [userId, Math.floor(limit * 0.7)] // 70% from database
    );

    let combinedReels = videoPosts.rows;

    // Try to fetch TikTok videos if configured
    const tiktokAccessToken = process.env.TIKTOK_ACCESS_TOKEN;
    if (tiktokAccessToken) {
      try {
        const tiktokApiUrl = 'https://open.tiktokapis.com/v2/video/list/';
        const response = await axios.post(
          tiktokApiUrl,
          {
            max_count: Math.floor(limit * 0.3), // 30% from TikTok
          },
          {
            headers: {
              'Authorization': `Bearer ${tiktokAccessToken}`,
              'Content-Type': 'application/json',
            },
            timeout: 5000, // 5 second timeout
          }
        );

        if (response.data && response.data.data && response.data.data.videos) {
          const tiktokVideos = response.data.data.videos.map(video => ({
            id: `tiktok_${video.id}`,
            source: 'tiktok',
            media_url: video.cover_image_url,
            video_url: video.share_url,
            caption: video.title || video.video_description,
            user: {
              username: video.username || 'TikTok User',
              full_name: video.username || 'TikTok User',
              is_verified: false,
            },
            reaction_count: video.like_count || 0,
            comment_count: video.comment_count || 0,
            share_count: video.share_count || 0,
            view_count: video.view_count || 0,
            created_at: video.create_time,
          }));

          // Mix TikTok videos with database videos
          combinedReels = [...combinedReels, ...tiktokVideos]
            .sort(() => Math.random() - 0.5) // Shuffle
            .slice(0, limit);
        }
      } catch (tiktokError) {
        console.error('Error fetching TikTok videos:', tiktokError.message);
        // Continue with just database videos if TikTok fails
      }
    }

    res.json(combinedReels);
  } catch (error) {
    console.error('Error fetching combined reels:', error);
    res.status(500).json({ error: 'Failed to fetch reels' });
  }
};
