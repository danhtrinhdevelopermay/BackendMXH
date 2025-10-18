const pool = require('../config/database');

const getNotifications = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT n.id, n.user_id, n.type, n.content, n.related_user_id, n.post_id, n.is_read, n.created_at,
       u.username, u.full_name, u.avatar_url,
       CASE 
         WHEN n.related_user_id IS NOT NULL THEN COALESCE(u.full_name, u.username) || ' ' || n.content
         ELSE n.content
       END as message
       FROM notifications n 
       LEFT JOIN users u ON n.related_user_id = u.id 
       WHERE n.user_id = $1 
       ORDER BY n.created_at DESC 
       LIMIT 50`,
      [user_id]
    );

    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const markAllAsRead = async (req, res) => {
  const user_id = req.user.id;

  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [user_id]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
