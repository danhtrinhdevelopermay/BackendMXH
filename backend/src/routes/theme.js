const express = require('express');
const router = express.Router();

const getThemeConfig = () => {
  const now = new Date();
  const month = now.getMonth() + 1; // 0-indexed, so add 1
  const day = now.getDate();

  // Kiểm tra xem có phải ngày 20/10 không
  const isWomensDay = month === 10 && day === 20;
  
  // Theme mặc định
  const defaultTheme = {
    id: 'default',
    name: 'Default Theme',
    colors: {
      primary: '#6200ee',
      primaryLight: '#7c4dff',
      primaryDark: '#4a148c',
      secondary: '#03dac6',
      background: '#ffffff',
      surface: '#ffffff',
      text: '#000000',
      textSecondary: '#65676b',
      error: '#b00020',
      success: '#4caf50',
      border: '#e4e6eb',
      card: '#f3f3f3',
      accent: '#1877f2',
      headerBackground: '#6200ee',
      headerText: '#ffffff',
      tabBarActive: '#6200ee',
      tabBarInactive: '#999999',
      navigationBar: '#ffffff',
      statusBar: '#6200ee',
    },
    assets: {
      logo: null,
      background: null,
      headerPattern: null,
    },
    effects: {
      enableParticles: false,
      particleColor: null,
    },
    event: null,
  };

  // Theme đặc biệt cho Ngày Quốc tế Phụ nữ 20/10
  const womensDayTheme = {
    id: 'womens-day-2024',
    name: "Ngày Quốc tế Phụ nữ 20/10",
    colors: {
      primary: '#ff1493', // Deep pink
      primaryLight: '#ff69b4', // Hot pink
      primaryDark: '#c71585', // Medium violet red
      secondary: '#ffb6c1', // Light pink
      background: '#fff5f7', // Very light pink background
      surface: '#ffffff',
      text: '#2d1b2e', // Dark purple-brown
      textSecondary: '#8b6f8e',
      error: '#e91e63',
      success: '#ff1493',
      border: '#ffcce0',
      card: '#ffe4ec',
      accent: '#ff1493',
      headerBackground: 'linear-gradient(135deg, #ff1493 0%, #ff69b4 100%)',
      headerText: '#ffffff',
      tabBarActive: '#ff1493',
      tabBarInactive: '#ffb6c1',
      navigationBar: '#fff5f7',
      statusBar: '#ff1493',
    },
    assets: {
      logo: null,
      background: null, 
      headerPattern: 'flowers',
    },
    effects: {
      enableParticles: true,
      particleType: 'flowers', // Hoa rơi
      particleColor: '#ff69b4',
      particleCount: 30,
    },
    event: {
      name: 'Ngày Quốc tế Phụ nữ',
      date: '20/10',
      greeting: 'Chúc mừng 20/10! 🌸💐',
      message: 'Chúc tất cả phụ nữ luôn xinh đẹp, hạnh phúc và thành công!',
    },
  };

  // Trả về theme tương ứng
  return isWomensDay ? womensDayTheme : defaultTheme;
};

// GET /api/theme/config - Lấy theme configuration
router.get('/config', (req, res) => {
  try {
    const theme = getThemeConfig();
    res.json({
      success: true,
      theme,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting theme config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get theme configuration',
    });
  }
});

// GET /api/theme/current-date - Endpoint để kiểm tra ngày hiện tại (for debugging)
router.get('/current-date', (req, res) => {
  const now = new Date();
  res.json({
    date: now.toISOString(),
    day: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
});

module.exports = router;
