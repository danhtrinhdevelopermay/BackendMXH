const { generateRecommendations, analyzeUserPreferences } = require('../services/recommendationService');
const cacheService = require('../services/cache');

const getRecommendedPosts = async (req, res) => {
  const user_id = req.user.id;
  const limit = parseInt(req.query.limit) || 20;

  const cacheKey = cacheService.getCacheKey('recommendations', user_id, limit);

  try {
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const recommendations = await generateRecommendations(user_id, limit);

    cacheService.set(cacheKey, recommendations, 300);

    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserPreferences = async (req, res) => {
  const user_id = req.user.id;

  try {
    const preferences = await analyzeUserPreferences(user_id);
    res.json(preferences);
  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getRecommendedPosts,
  getUserPreferences
};
