const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy-policy.html'));
});

app.get('/install-guide', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'install-guide.html'));
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Landing page server running on port ${PORT}`);
  
  // Anti-spindown system for Render.com
  const RENDER_URL = process.env.RENDER_URL || 'https://shattering.onrender.com';
  const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (Render spins down after 15 mins)
  
  // Only run anti-spindown in production (on Render)
  if (process.env.RENDER) {
    console.log(`🔄 Anti-spindown system activated for ${RENDER_URL}`);
    
    function keepAlive() {
      axios.get(`${RENDER_URL}/health`)
        .then(response => {
          console.log(`✅ Self-ping successful at ${new Date().toISOString()}: Status ${response.status}`);
        })
        .catch(error => {
          console.error(`❌ Self-ping failed at ${new Date().toISOString()}:`, error.message);
        });
    }
    
    // Initial ping after 30 seconds
    setTimeout(keepAlive, 30000);
    
    // Then ping every 14 minutes
    setInterval(keepAlive, PING_INTERVAL);
  } else {
    console.log('🏠 Running in development mode - anti-spindown disabled');
  }
});
