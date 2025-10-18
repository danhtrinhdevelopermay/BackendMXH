const pool = require('../config/database');
const oneSignalService = require('../services/oneSignalService');

const registerPushToken = async (req, res) => {
  const { push_token, device_type } = req.body;
  const user_id = req.user.id;

  if (!push_token) {
    return res.status(400).json({ error: 'Push token is required' });
  }

  try {
    await pool.query(
      `INSERT INTO push_tokens (user_id, push_token, device_type, updated_at) 
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, push_token) 
       DO UPDATE SET updated_at = NOW(), device_type = $3`,
      [user_id, push_token, device_type || 'unknown']
    );

    console.log(`[PUSH] Registered OneSignal player ID for user ${user_id}: ${push_token}`);
    res.json({ message: 'Push token registered successfully' });
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deletePushToken = async (req, res) => {
  const { push_token } = req.body;
  const user_id = req.user.id;

  try {
    await pool.query(
      'DELETE FROM push_tokens WHERE user_id = $1 AND push_token = $2',
      [user_id, push_token]
    );

    res.json({ message: 'Push token deleted successfully' });
  } catch (error) {
    console.error('Delete push token error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    console.log(`[PUSH] Starting push notification for user ${userId}`);
    console.log(`[PUSH] Title: ${title}, Body: ${body}`);
    
    const result = await pool.query(
      'SELECT push_token FROM push_tokens WHERE user_id = $1',
      [userId]
    );

    console.log(`[PUSH] Found ${result.rows.length} push tokens for user ${userId}`);

    if (result.rows.length === 0) {
      console.log(`[PUSH] No push tokens found for user ${userId}`);
      return { success: false, message: 'No push tokens found for user' };
    }

    const playerIds = result.rows.map(row => row.push_token);
    
    const oneSignalResult = await oneSignalService.sendNotification(
      playerIds,
      title,
      body,
      data
    );

    if (oneSignalResult.success) {
      console.log(`[PUSH] Successfully sent push notification to user ${userId}`);
      return { success: true, data: oneSignalResult.data };
    } else {
      console.error(`[PUSH] Failed to send notification: ${oneSignalResult.error}`);
      return { success: false, error: oneSignalResult.error };
    }
  } catch (error) {
    console.error('[PUSH] Send push notification error:', error);
    return { success: false, error: error.message };
  }
};

const sendTestNotification = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await sendPushNotification(
      user_id,
      '🔔 Test Notification',
      'Push notifications đang hoạt động tốt! Bạn sẽ nhận được thông báo khi có tin nhắn mới, bình luận, hoặc lời mời kết bạn.',
      { screen: 'Notifications' }
    );

    if (result.success) {
      res.json({ message: 'Test notification sent successfully', data: result.data });
    } else {
      res.status(400).json({ error: result.error || result.message || 'Failed to send test notification' });
    }
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  registerPushToken,
  deletePushToken,
  sendPushNotification,
  sendTestNotification
};
