const pool = require('../config/database');

// Helper function to ensure user_id_1 < user_id_2
const orderUserIds = (userId1, userId2) => {
  return userId1 < userId2 
    ? { user_id_1: userId1, user_id_2: userId2 }
    : { user_id_1: userId2, user_id_2: userId1 };
};

// Get streak between two users
const getStreak = async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  try {
    const { user_id_1, user_id_2 } = orderUserIds(currentUserId, parseInt(userId));

    const result = await pool.queryAll(
      `SELECT streak_count, last_interaction_date 
       FROM message_streaks 
       WHERE user_id_1 = $1 AND user_id_2 = $2`,
      [user_id_1, user_id_2]
    );

    if (result.rows.length === 0) {
      return res.json({ streak_count: 0, last_interaction_date: null });
    }

    // Check if streak is still valid (messaged yesterday or today)
    const lastDate = new Date(result.rows[0].last_interaction_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (daysDiff > 1) {
      // Streak broken, reset to 0
      await pool.query(
        `UPDATE message_streaks 
         SET streak_count = 0 
         WHERE user_id_1 = $1 AND user_id_2 = $2`,
        [user_id_1, user_id_2]
      );
      return res.json({ streak_count: 0, last_interaction_date: null });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all user streaks (for profile display)
const getUserStreaks = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.queryAll(
      `SELECT 
        CASE 
          WHEN user_id_1 = $1 THEN user_id_2 
          ELSE user_id_1 
        END as other_user_id,
        streak_count,
        last_interaction_date
       FROM message_streaks 
       WHERE (user_id_1 = $1 OR user_id_2 = $1) 
       AND streak_count >= 10
       ORDER BY streak_count DESC`,
      [user_id]
    );

    // Get user details for each streak
    const streaksWithUsers = await Promise.all(
      result.rows.map(async (streak) => {
        const userResult = await pool.queryAll(
          `SELECT id, username, full_name, avatar_url, is_verified 
           FROM users WHERE id = $1`,
          [streak.other_user_id]
        );
        
        return {
          ...streak,
          user: userResult.rows[0]
        };
      })
    );

    res.json(streaksWithUsers);
  } catch (error) {
    console.error('Get user streaks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update streak when message is sent
const updateStreak = async (senderId, receiverId) => {
  try {
    const { user_id_1, user_id_2 } = orderUserIds(senderId, receiverId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if streak exists
    const existingStreak = await pool.queryAll(
      `SELECT streak_count, last_interaction_date 
       FROM message_streaks 
       WHERE user_id_1 = $1 AND user_id_2 = $2`,
      [user_id_1, user_id_2]
    );

    if (existingStreak.rows.length === 0) {
      // Create new streak
      await pool.query(
        `INSERT INTO message_streaks (user_id_1, user_id_2, streak_count, last_interaction_date)
         VALUES ($1, $2, 1, CURRENT_DATE)`,
        [user_id_1, user_id_2]
      );
      console.log(`[STREAK] Created new streak between users ${user_id_1} and ${user_id_2}`);
      return { streak_count: 1, is_new: true };
    }

    const lastDate = new Date(existingStreak.rows[0].last_interaction_date);
    lastDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no update needed
      console.log(`[STREAK] Same day, no update needed for users ${user_id_1} and ${user_id_2}`);
      return { streak_count: existingStreak.rows[0].streak_count, is_new: false };
    } else if (daysDiff === 1) {
      // Next day, increment streak
      const newCount = existingStreak.rows[0].streak_count + 1;
      await pool.query(
        `UPDATE message_streaks 
         SET streak_count = $1, last_interaction_date = CURRENT_DATE, updated_at = NOW()
         WHERE user_id_1 = $2 AND user_id_2 = $3`,
        [newCount, user_id_1, user_id_2]
      );
      console.log(`[STREAK] Incremented streak to ${newCount} for users ${user_id_1} and ${user_id_2}`);
      return { streak_count: newCount, is_new: true };
    } else {
      // Streak broken, reset to 1
      await pool.query(
        `UPDATE message_streaks 
         SET streak_count = 1, last_interaction_date = CURRENT_DATE, updated_at = NOW()
         WHERE user_id_1 = $1 AND user_id_2 = $2`,
        [user_id_1, user_id_2]
      );
      console.log(`[STREAK] Reset streak to 1 for users ${user_id_1} and ${user_id_2}`);
      return { streak_count: 1, is_new: true };
    }
  } catch (error) {
    console.error('[STREAK] Update streak error:', error);
    return { error: error.message };
  }
};

// Get milestone streaks (10, 30, 50, 100, etc.)
const getMilestoneStreaks = (streakCount) => {
  const milestones = [10, 30, 50, 100, 200, 300, 500, 1000];
  const achieved = milestones.filter(m => streakCount >= m);
  const next = milestones.find(m => streakCount < m);
  
  return {
    achieved,
    next,
    is_milestone: milestones.includes(streakCount)
  };
};

module.exports = {
  getStreak,
  getUserStreaks,
  updateStreak,
  getMilestoneStreaks
};
