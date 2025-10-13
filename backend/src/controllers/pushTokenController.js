const pool = require('../config/database');
const { Expo } = require('expo-server-sdk');

const expo = new Expo();

const registerPushToken = async (req, res) => {
  const { push_token, device_type } = req.body;
  const user_id = req.user.id;

  if (!Expo.isExpoPushToken(push_token)) {
    return res.status(400).json({ error: 'Invalid push token' });
  }

  try {
    await pool.query(
      `INSERT INTO push_tokens (user_id, push_token, device_type, updated_at) 
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, push_token) 
       DO UPDATE SET updated_at = NOW(), device_type = $3`,
      [user_id, push_token, device_type]
    );

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

    const messages = result.rows
      .filter(row => Expo.isExpoPushToken(row.push_token))
      .map(row => ({
        to: row.push_token,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        priority: 'high',
        channelId: 'default'
      }));

    console.log(`[PUSH] Valid push tokens: ${messages.length}`);

    if (messages.length === 0) {
      console.log(`[PUSH] No valid push tokens for user ${userId}`);
      return { success: false, message: 'No valid push tokens' };
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    console.log(`[PUSH] Sending ${chunks.length} chunks of notifications`);

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(`[PUSH] Sent chunk successfully:`, ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('[PUSH] Error sending push notification chunk:', error);
      }
    }

    console.log(`[PUSH] Successfully sent push notification to user ${userId}`);
    return { success: true, tickets };
  } catch (error) {
    console.error('[PUSH] Send push notification error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  registerPushToken,
  deletePushToken,
  sendPushNotification
};
