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
    const result = await pool.query(
      'SELECT push_token FROM push_tokens WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
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

    if (messages.length === 0) {
      return { success: false, message: 'No valid push tokens' };
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    return { success: true, tickets };
  } catch (error) {
    console.error('Send push notification error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  registerPushToken,
  deletePushToken,
  sendPushNotification
};
