require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(__dirname));

app.get('/config.js', (req, res) => {
  const config = {
    apiUrl: process.env.API_URL || 'http://localhost:5000'
  };
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.APP_CONFIG = ${JSON.stringify(config)};`);
});

// SPA fallback - handle all other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web server is running on port ${PORT}`);
  console.log(`API URL: ${process.env.API_URL || 'http://localhost:5000'}`);
});
