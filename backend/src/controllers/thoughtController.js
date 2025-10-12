const pool = require('../config/database');

const createOrUpdateThought = async (req, res) => {
  const { content, emoji } = req.body;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `INSERT INTO user_thoughts (user_id, content, emoji, updated_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
       ON CONFLICT (user_id) 
       DO UPDATE SET content = $2, emoji = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, content, emoji]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Create/Update thought error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllThoughts = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT t.*, u.username, u.full_name, u.avatar_url
       FROM user_thoughts t
       JOIN users u ON t.user_id = u.id
       WHERE t.user_id = $1 
       OR t.user_id IN (
         SELECT addressee_id FROM friendships 
         WHERE requester_id = $1 AND status = 'accepted'
         UNION
         SELECT requester_id FROM friendships 
         WHERE addressee_id = $1 AND status = 'accepted'
       )
       ORDER BY t.updated_at DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get thoughts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserThought = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT t.*, u.username, u.full_name, u.avatar_url
       FROM user_thoughts t
       JOIN users u ON t.user_id = u.id
       WHERE t.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Thought not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user thought error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteThought = async (req, res) => {
  const user_id = req.user.id;

  try {
    await pool.query('DELETE FROM user_thoughts WHERE user_id = $1', [user_id]);
    res.status(200).json({ message: 'Thought deleted successfully' });
  } catch (error) {
    console.error('Delete thought error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createOrUpdateThought,
  getAllThoughts,
  getUserThought,
  deleteThought,
};
