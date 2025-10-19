const pool = require('../config/database');
const cacheService = require('./cache');

class AutoReactionService {
  constructor() {
    this.isRunning = false;
    this.processedPosts = new Set();
    this.fakeUsers = [];
    this.reactionTypes = ['like', 'love', 'haha', 'wow', 'sad'];
    this.checkInterval = 10000;
  }

  async initialize() {
    console.log('🤖 Đang khởi tạo Auto Reaction Service...');
    await this.loadFakeUsers();
    console.log(`✅ Đã tải ${this.fakeUsers.length} tài khoản ảo`);
  }

  async loadFakeUsers() {
    try {
      const result = await pool.queryAll(
        `SELECT id FROM users WHERE email LIKE '%@fake.com' ORDER BY id`
      );
      
      this.fakeUsers = result.rows.map(row => row.id);
      
      if (this.fakeUsers.length === 0) {
        console.warn('⚠️ Không tìm thấy tài khoản ảo nào. Vui lòng chạy script createFakeUsers.js trước.');
      }
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách tài khoản ảo:', error);
      this.fakeUsers = [];
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Auto Reaction Service đã đang chạy');
      return;
    }

    await this.initialize();
    
    if (this.fakeUsers.length === 0) {
      console.error('❌ Không thể khởi động service vì không có tài khoản ảo');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Auto Reaction Service đã khởi động');
    console.log(`📊 Sẽ kiểm tra bài viết mới mỗi ${this.checkInterval / 1000} giây`);
    
    this.checkForNewPosts();
  }

  stop() {
    this.isRunning = false;
    if (this.checkTimeout) {
      clearTimeout(this.checkTimeout);
    }
    console.log('🛑 Auto Reaction Service đã dừng');
  }

  async checkForNewPosts() {
    if (!this.isRunning) return;

    try {
      const result = await pool.query(
        `SELECT p.id, p.user_id, p.created_at 
         FROM posts p
         WHERE p.created_at > NOW() - INTERVAL '5 minutes'
         AND p.user_id NOT IN (SELECT id FROM users WHERE email LIKE '%@fake.com')
         ORDER BY p.created_at DESC
         LIMIT 20`
      );

      for (const post of result.rows) {
        if (!this.processedPosts.has(post.id)) {
          this.processedPosts.add(post.id);
          console.log(`📝 Phát hiện bài viết mới: ID ${post.id}`);
          this.scheduleReactionsForPost(post);
        }
      }

      if (this.processedPosts.size > 1000) {
        const postsArray = Array.from(this.processedPosts);
        this.processedPosts = new Set(postsArray.slice(-500));
      }
    } catch (error) {
      console.error('❌ Lỗi khi kiểm tra bài viết mới:', error);
    }

    this.checkTimeout = setTimeout(() => this.checkForNewPosts(), this.checkInterval);
  }

  scheduleReactionsForPost(post) {
    if (this.fakeUsers.length === 0) return;

    const numReactions = this.getRandomReactionCount();
    const selectedUsers = this.selectRandomUsers(numReactions);
    
    console.log(`   ➡️ Sẽ thả ${numReactions} cảm xúc cho bài viết ${post.id}`);

    selectedUsers.forEach((userId, index) => {
      const delay = this.getRandomDelay(index, selectedUsers.length);
      
      setTimeout(() => {
        this.addReaction(post.id, userId, post.user_id);
      }, delay);
    });
  }

  getRandomReactionCount() {
    const ranges = [
      { min: 3, max: 8, weight: 20 },
      { min: 8, max: 15, weight: 35 },
      { min: 15, max: 25, weight: 25 },
      { min: 25, max: 40, weight: 15 },
      { min: 40, max: 60, weight: 5 }
    ];

    const totalWeight = ranges.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const range of ranges) {
      random -= range.weight;
      if (random <= 0) {
        return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      }
    }
    
    return Math.floor(Math.random() * 8) + 3;
  }

  selectRandomUsers(count) {
    const shuffled = [...this.fakeUsers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, this.fakeUsers.length));
  }

  getRandomDelay(index, total) {
    const minDelay = 5000;
    const maxDelay = 180000;
    
    const baseDelay = minDelay + (Math.random() * (maxDelay - minDelay) * (index / total));
    
    const variance = baseDelay * 0.3;
    const randomVariance = (Math.random() - 0.5) * variance;
    
    return Math.floor(baseDelay + randomVariance);
  }

  getRandomReactionType() {
    const weights = {
      'like': 40,
      'love': 30,
      'haha': 15,
      'wow': 10,
      'sad': 5
    };

    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (const [type, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        return type;
      }
    }

    return 'like';
  }

  async addReaction(postId, userId, postOwnerId) {
    try {
      const existing = await pool.query(
        'SELECT * FROM reactions WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );

      if (existing.rows.length > 0) {
        return;
      }

      const reactionType = this.getRandomReactionType();

      await pool.query(
        'INSERT INTO reactions (post_id, user_id, reaction_type) VALUES ($1, $2, $3)',
        [postId, userId, reactionType]
      );

      console.log(`   ✨ Đã thả cảm xúc ${reactionType} cho bài viết ${postId} từ user ${userId}`);

      cacheService.delPattern('newsfeed:');
      cacheService.delPattern('userposts:');

    } catch (error) {
      if (!error.message.includes('duplicate key')) {
        console.error(`   ❌ Lỗi khi thả cảm xúc cho bài ${postId}:`, error.message);
      }
    }
  }

  getStats() {
    return {
      isRunning: this.isRunning,
      fakeUsersCount: this.fakeUsers.length,
      processedPostsCount: this.processedPosts.size,
      checkInterval: this.checkInterval
    };
  }
}

const autoReactionService = new AutoReactionService();

module.exports = autoReactionService;
