const cron = require('node-cron');
const pool = require('../config/database');

class MessageCleanupService {
  constructor() {
    this.isRunning = false;
  }

  async cleanupOldMessages() {
    try {
      console.log('[MESSAGE CLEANUP] Starting cleanup of messages older than 24 hours...');
      
      const result = await pool.query(
        `DELETE FROM messages 
         WHERE created_at < NOW() - INTERVAL '24 hours'
         RETURNING id`
      );

      const deletedCount = result.rowCount || 0;
      console.log(`[MESSAGE CLEANUP] Deleted ${deletedCount} messages older than 24 hours`);

      await pool.query(
        `INSERT INTO cleanup_logs (cleanup_type, records_deleted, status)
         VALUES ($1, $2, $3)`,
        ['messages', deletedCount, 'success']
      ).catch(err => console.error('Failed to log cleanup:', err));

      return {
        success: true,
        deletedCount
      };
    } catch (error) {
      console.error('[MESSAGE CLEANUP] Error cleaning up messages:', error);
      
      await pool.query(
        `INSERT INTO cleanup_logs (cleanup_type, status, error_message)
         VALUES ($1, $2, $3)`,
        ['messages', 'failed', error.message]
      ).catch(err => console.error('Failed to log cleanup error:', err));

      return {
        success: false,
        error: error.message
      };
    }
  }

  start() {
    if (this.isRunning) {
      console.log('[MESSAGE CLEANUP] Service is already running');
      return;
    }

    console.log('[MESSAGE CLEANUP] Starting message cleanup service...');
    
    cron.schedule('0 */6 * * *', async () => {
      console.log('[MESSAGE CLEANUP] Running scheduled cleanup (every 6 hours)...');
      await this.cleanupOldMessages();
    });

    this.isRunning = true;
    console.log('[MESSAGE CLEANUP] Service started successfully. Will run every 6 hours.');
    
    this.cleanupOldMessages();
  }

  stop() {
    this.isRunning = false;
    console.log('[MESSAGE CLEANUP] Service stopped');
  }

  async runManualCleanup() {
    console.log('[MESSAGE CLEANUP] Running manual cleanup...');
    return await this.cleanupOldMessages();
  }
}

module.exports = new MessageCleanupService();
