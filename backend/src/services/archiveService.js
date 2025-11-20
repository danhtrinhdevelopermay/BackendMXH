const cron = require('node-cron');
const pool = require('../config/database');
const { archiveOldMessagesToDrive, archiveOldNotificationsToDrive } = require('./googleDriveService');

class ArchiveService {
  constructor() {
    this.isRunning = false;
    this.schedule = '0 2 * * 0';
    this.task = null;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Archive Service đã đang chạy');
      return;
    }

    this.task = cron.schedule(this.schedule, async () => {
      console.log('🗄️ Bắt đầu archive tự động...');
      await this.runArchive();
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh"
    });

    this.isRunning = true;
    console.log('✅ Archive Service đã khởi động - Chạy mỗi Chủ nhật lúc 2 giờ sáng');
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    this.isRunning = false;
    console.log('🛑 Archive Service đã dừng');
  }

  async runArchive() {
    try {
      console.log('📦 Archive messages...');
      const messagesResult = await archiveOldMessagesToDrive(pool);
      console.log(`✅ Đã archive ${messagesResult.archived} messages`);

      console.log('📦 Archive notifications...');
      const notificationsResult = await archiveOldNotificationsToDrive(pool);
      console.log(`✅ Đã archive ${notificationsResult.archived} notifications`);

      return {
        success: true,
        messages: messagesResult,
        notifications: notificationsResult,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Lỗi khi archive:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      schedule: this.schedule,
      description: 'Archive messages và notifications cũ hơn 30 ngày mỗi Chủ nhật lúc 2 giờ sáng'
    };
  }
}

module.exports = new ArchiveService();
