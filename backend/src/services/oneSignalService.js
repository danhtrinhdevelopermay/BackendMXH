const axios = require('axios');

class OneSignalService {
  constructor() {
    this.appId = process.env.ONESIGNAL_APP_ID;
    this.restApiKey = process.env.ONESIGNAL_REST_API_KEY;
    this.apiUrl = 'https://onesignal.com/api/v1';
  }

  async sendNotification(playerIds, title, message, data = {}) {
    if (!this.appId || !this.restApiKey) {
      console.error('[OneSignal] Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY');
      return { success: false, error: 'OneSignal not configured' };
    }

    if (!playerIds || playerIds.length === 0) {
      console.log('[OneSignal] No player IDs provided');
      return { success: false, error: 'No player IDs' };
    }

    try {
      console.log(`[OneSignal] Sending notification to ${playerIds.length} device(s)`);
      console.log(`[OneSignal] Title: ${title}, Message: ${message}`);

      const payload = {
        app_id: this.appId,
        include_player_ids: playerIds,
        headings: { en: title },
        contents: { en: message },
        data: data,
        android_channel_id: 'default',
        priority: 10,
        ttl: 86400
      };

      const response = await axios.post(
        `${this.apiUrl}/notifications`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.restApiKey}`
          }
        }
      );

      console.log('[OneSignal] Notification sent successfully:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[OneSignal] Error sending notification:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async sendNotificationToExternalUserId(externalUserId, title, message, data = {}) {
    if (!this.appId || !this.restApiKey) {
      console.error('[OneSignal] Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY');
      return { success: false, error: 'OneSignal not configured' };
    }

    try {
      console.log(`[OneSignal] Sending notification to external user ID: ${externalUserId}`);
      console.log(`[OneSignal] Title: ${title}, Message: ${message}`);

      const payload = {
        app_id: this.appId,
        include_external_user_ids: [externalUserId.toString()],
        headings: { en: title },
        contents: { en: message },
        data: data,
        android_channel_id: 'default',
        priority: 10,
        ttl: 86400
      };

      const response = await axios.post(
        `${this.apiUrl}/notifications`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.restApiKey}`
          }
        }
      );

      console.log('[OneSignal] Notification sent successfully:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[OneSignal] Error sending notification:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }
}

module.exports = new OneSignalService();
