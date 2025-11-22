const { GoogleGenAI } = require('@google/genai');
const pool = require('../config/database');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function analyzeUserPreferences(userId) {
  try {
    const userInteractions = await pool.queryAll(
      `SELECT 
        p.id,
        p.content,
        p.created_at,
        r.reaction_type,
        c.content as comment_content,
        CASE 
          WHEN r.user_id IS NOT NULL THEN 'reaction'
          WHEN c.user_id IS NOT NULL THEN 'comment'
          ELSE 'other'
        END as interaction_type
       FROM posts p
       LEFT JOIN reactions r ON p.id = r.post_id AND r.user_id = $1
       LEFT JOIN comments c ON p.id = c.post_id AND c.user_id = $1
       WHERE (r.user_id = $1 OR c.user_id = $1)
       ORDER BY p.created_at DESC
       LIMIT 50`,
      [userId]
    );

    if (!userInteractions.rows || userInteractions.rows.length === 0) {
      return {
        topics: [],
        keywords: [],
        sentiment: 'neutral'
      };
    }

    const postsContent = userInteractions.rows
      .map(row => row.content)
      .filter(content => content)
      .join('\n\n');

    const systemPrompt = `Bạn là AI chuyên phân tích sở thích người dùng từ các bài viết họ tương tác. 
Phân tích các bài viết và trả về JSON với:
- topics: mảng các chủ đề chính (tối đa 5)
- keywords: mảng từ khóa quan trọng (tối đa 10)
- sentiment: tâm trạng chung (positive/neutral/negative)`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            topics: { type: 'array', items: { type: 'string' } },
            keywords: { type: 'array', items: { type: 'string' } },
            sentiment: { type: 'string' }
          },
          required: ['topics', 'keywords', 'sentiment']
        }
      },
      contents: postsContent
    });

    const preferences = JSON.parse(response.text);
    return preferences;

  } catch (error) {
    console.error('Error analyzing user preferences:', error);
    return {
      topics: [],
      keywords: [],
      sentiment: 'neutral'
    };
  }
}

async function generateRecommendations(userId, limit = 20) {
  try {
    const preferences = await analyzeUserPreferences(userId);

    if (preferences.topics.length === 0 && preferences.keywords.length === 0) {
      const fallbackPosts = await pool.queryAll(
        `WITH friend_ids AS (
          SELECT CASE 
            WHEN requester_id = $1 THEN addressee_id 
            ELSE requester_id 
          END as friend_id
          FROM friendships 
          WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)
        ),
        reaction_breakdown AS (
          SELECT post_id,
            COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) as like_count,
            COUNT(CASE WHEN reaction_type = 'love' THEN 1 END) as love_count,
            COUNT(CASE WHEN reaction_type = 'haha' THEN 1 END) as haha_count,
            COUNT(CASE WHEN reaction_type = 'wow' THEN 1 END) as wow_count,
            COUNT(CASE WHEN reaction_type = 'sad' THEN 1 END) as sad_count,
            COUNT(CASE WHEN reaction_type = 'angry' THEN 1 END) as angry_count
          FROM reactions
          GROUP BY post_id
        )
        SELECT p.id, p.user_id, p.content, p.media_url, p.media_type, p.media_width, p.media_height, p.privacy, p.created_at,
          u.username, u.full_name, u.avatar_url, u.is_verified,
          COALESCE((SELECT COUNT(*) FROM reactions WHERE post_id = p.id), 0) as reaction_count,
          COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id), 0) as comment_count,
          COALESCE(rb.like_count, 0)::int as like_count,
          COALESCE(rb.love_count, 0)::int as love_count,
          COALESCE(rb.haha_count, 0)::int as haha_count,
          COALESCE(rb.wow_count, 0)::int as wow_count,
          COALESCE(rb.sad_count, 0)::int as sad_count,
          COALESCE(rb.angry_count, 0)::int as angry_count,
          r.reaction_type as user_reaction
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN reaction_breakdown rb ON rb.post_id = p.id
        LEFT JOIN reactions r ON r.post_id = p.id AND r.user_id = $1
        WHERE p.user_id != $1
          AND (p.privacy = 'public' OR (p.privacy = 'friends' AND p.user_id IN (SELECT friend_id FROM friend_ids)))
          AND p.id NOT IN (SELECT post_id FROM reactions WHERE user_id = $1)
        ORDER BY 
          (COALESCE((SELECT COUNT(*) FROM reactions WHERE post_id = p.id), 0) * 2 + 
           COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id), 0)) DESC,
          p.created_at DESC
        LIMIT $2`,
        [userId, limit]
      );

      const rows = fallbackPosts.rows || [];
      return rows.map(row => ({
        ...row,
        reaction_breakdown: {
          like: row.like_count || 0,
          love: row.love_count || 0,
          haha: row.haha_count || 0,
          wow: row.wow_count || 0,
          sad: row.sad_count || 0,
          angry: row.angry_count || 0
        }
      }));
    }

    const searchTerms = [...preferences.topics, ...preferences.keywords]
      .filter(term => term && term.length > 2)
      .slice(0, 10);

    let whereConditions = [];
    let params = [userId];
    
    searchTerms.forEach((term, index) => {
      params.push(`%${term}%`);
      whereConditions.push(`p.content ILIKE $${params.length}`);
    });

    const whereClause = whereConditions.length > 0 
      ? `AND (${whereConditions.join(' OR ')})` 
      : '';

    const query = `
      WITH friend_ids AS (
        SELECT CASE 
          WHEN requester_id = $1 THEN addressee_id 
          ELSE requester_id 
        END as friend_id
        FROM friendships 
        WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)
      ),
      reaction_breakdown AS (
        SELECT post_id,
          COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) as like_count,
          COUNT(CASE WHEN reaction_type = 'love' THEN 1 END) as love_count,
          COUNT(CASE WHEN reaction_type = 'haha' THEN 1 END) as haha_count,
          COUNT(CASE WHEN reaction_type = 'wow' THEN 1 END) as wow_count,
          COUNT(CASE WHEN reaction_type = 'sad' THEN 1 END) as sad_count,
          COUNT(CASE WHEN reaction_type = 'angry' THEN 1 END) as angry_count
        FROM reactions
        GROUP BY post_id
      )
      SELECT p.id, p.user_id, p.content, p.media_url, p.media_type, p.media_width, p.media_height, p.privacy, p.created_at,
        u.username, u.full_name, u.avatar_url, u.is_verified,
        COALESCE((SELECT COUNT(*) FROM reactions WHERE post_id = p.id), 0) as reaction_count,
        COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id), 0) as comment_count,
        COALESCE(rb.like_count, 0)::int as like_count,
        COALESCE(rb.love_count, 0)::int as love_count,
        COALESCE(rb.haha_count, 0)::int as haha_count,
        COALESCE(rb.wow_count, 0)::int as wow_count,
        COALESCE(rb.sad_count, 0)::int as sad_count,
        COALESCE(rb.angry_count, 0)::int as angry_count,
        r.reaction_type as user_reaction
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN reaction_breakdown rb ON rb.post_id = p.id
      LEFT JOIN reactions r ON r.post_id = p.id AND r.user_id = $1
      WHERE p.user_id != $1
        AND (p.privacy = 'public' OR (p.privacy = 'friends' AND p.user_id IN (SELECT friend_id FROM friend_ids)))
        ${whereClause}
      ORDER BY 
        (COALESCE((SELECT COUNT(*) FROM reactions WHERE post_id = p.id), 0) * 2 + 
         COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id), 0)) DESC,
        p.created_at DESC
      LIMIT ${limit}
    `;

    const result = await pool.queryAll(query, params);
    
    const rows = result.rows || [];
    return rows.map(row => ({
      ...row,
      reaction_breakdown: {
        like: row.like_count || 0,
        love: row.love_count || 0,
        haha: row.haha_count || 0,
        wow: row.wow_count || 0,
        sad: row.sad_count || 0,
        angry: row.angry_count || 0
      }
    }));

  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
}

module.exports = {
  analyzeUserPreferences,
  generateRecommendations
};
