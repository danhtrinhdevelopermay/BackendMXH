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
      const tiktokVideos = response.data.data.videos.map(video => {
        const coverUrl = video.cover_image_url || 'https://via.placeholder.com/400x600/000000/FFFFFF/?text=TikTok+Video';
        return {
          id: `tiktok_${video.id}`,
          source: 'tiktok',
          cover_image_url: coverUrl,
          media_url: coverUrl,
          video_url: video.share_url,
          share_url: video.share_url,
          embed_link: video.embed_link,
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
          is_playable: false,
        };
      });

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

    // Try to fetch TikTok videos first to determine DB query size
    const tiktokAccessToken = process.env.TIKTOK_ACCESS_TOKEN;
    let dbLimit = limit; // Default to full limit
    
    if (tiktokAccessToken) {
      // If TikTok is configured, we'll try to get 30% from TikTok
      // So we only need 70% from DB
      dbLimit = Math.floor(limit * 0.7);
    }

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
      ORDER BY p.created_at DESC
      LIMIT $2`,
      [userId, dbLimit]
    );

    let combinedReels = videoPosts.rows;
    let tiktokFetchSuccess = false;

    // Try to fetch TikTok videos if configured
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

        if (response.data && response.data.data && response.data.data.videos && Array.isArray(response.data.data.videos)) {
          const tiktokVideos = response.data.data.videos.map(video => {
            const coverUrl = video.cover_image_url || 'https://via.placeholder.com/400x600/000000/FFFFFF/?text=TikTok+Video';
            return {
              id: `tiktok_${video.id}`,
              source: 'tiktok',
              cover_image_url: coverUrl,
              media_url: coverUrl,
              video_url: video.share_url,
              share_url: video.share_url,
              embed_link: video.embed_link,
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
              is_playable: false,
            };
          });

          // Mix TikTok videos with database videos only if we have TikTok videos
          if (tiktokVideos.length > 0) {
            tiktokFetchSuccess = true;
            combinedReels = [...combinedReels, ...tiktokVideos]
              .sort(() => Math.random() - 0.5) // Shuffle
              .slice(0, limit);
          }
        }
      } catch (tiktokError) {
        console.error('Error fetching TikTok videos:', tiktokError.message);
        // TikTok failed, we'll need to fetch more from DB below
      }
    }

    // If we still don't have enough reels (TikTok failed or returned fewer than expected),
    // fetch additional DB videos to meet the limit
    if (combinedReels.length < limit) {
      // Count how many DB videos we already have (excluding TikTok videos)
      const dbVideosCount = combinedReels.filter(r => !r.source || r.source !== 'tiktok').length;
      const neededCount = limit - combinedReels.length;
      
      const additionalVideos = await db.query(
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
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3`,
        [userId, neededCount, dbVideosCount]
      );
      
      combinedReels = [...combinedReels, ...additionalVideos.rows];
    }

    res.json(combinedReels);
  } catch (error) {
    console.error('Error fetching combined reels:', error);
    res.status(500).json({ error: 'Failed to fetch reels' });
  }
};
