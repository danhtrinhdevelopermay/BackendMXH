require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const authRoutes = require('./src/routes/auth');
const postRoutes = require('./src/routes/posts');
const commentRoutes = require('./src/routes/comments');
const reactionRoutes = require('./src/routes/reactions');
const friendshipRoutes = require('./src/routes/friendships');
const messageRoutes = require('./src/routes/messages');
const messageReactionRoutes = require('./src/routes/messageReactions');
const notificationRoutes = require('./src/routes/notifications');
const userRoutes = require('./src/routes/users');
const pushTokenRoutes = require('./src/routes/pushTokens');
const thoughtRoutes = require('./src/routes/thoughts');
const storyRoutes = require('./src/routes/stories');
const streakRoutes = require('./src/routes/streaks');
const { authenticateToken } = require('./src/middleware/auth');
const pool = require('./src/config/database');
const cloudinary = require('./src/config/cloudinary');
const autoReactionService = require('./src/services/autoReactionService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.get('/', (req, res) => {
  res.json({ message: 'Social Media API is running' });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is healthy'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/friendships', friendshipRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/message-reactions', messageReactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/push-tokens', pushTokenRoutes);
app.use('/api/thoughts', thoughtRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/streaks', streakRoutes);

app.get('/api/auto-reactions/status', authenticateToken, (req, res) => {
  res.json(autoReactionService.getStats());
});

app.post('/api/auto-reactions/start', authenticateToken, async (req, res) => {
  try {
    await autoReactionService.start();
    res.json({ message: 'Auto Reaction Service started', stats: autoReactionService.getStats() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start service', details: error.message });
  }
});

app.post('/api/auto-reactions/stop', authenticateToken, (req, res) => {
  autoReactionService.stop();
  res.json({ message: 'Auto Reaction Service stopped', stats: autoReactionService.getStats() });
});

app.post('/api/upload', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    console.log('Upload request received from user:', req.user.id);
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const mediaType = req.file.mimetype;
    const fileSize = req.file.size;
    
    console.log(`Uploading media - Type: ${mediaType}, Size: ${fileSize} bytes`);
    
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'posts',
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const mediaWidth = uploadResult.width || null;
    const mediaHeight = uploadResult.height || null;

    const result = await pool.query(
      'INSERT INTO posts (user_id, media_url, media_type, media_width, media_height) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.user.id, uploadResult.secure_url, mediaType, mediaWidth, mediaHeight]
    );

    const mediaId = result.rows[0].id;
    console.log(`Media uploaded successfully to Cloudinary with post ID: ${mediaId}, dimensions: ${mediaWidth}x${mediaHeight}`);
    
    res.json({ 
      id: mediaId,
      url: uploadResult.secure_url,
      type: mediaType,
      width: mediaWidth,
      height: mediaHeight
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

app.get('/api/media/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT media_url FROM posts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0 || !result.rows[0].media_url) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.redirect(result.rows[0].media_url);
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Failed to get media' });
  }
});

app.post('/api/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  const { updateAvatar } = require('./src/controllers/authController');
  updateAvatar(req, res);
});

app.get('/api/avatar/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].avatar_url) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    res.redirect(result.rows[0].avatar_url);
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({ error: 'Failed to get avatar' });
  }
});

app.post('/api/cover', authenticateToken, upload.single('cover'), async (req, res) => {
  const { updateCover } = require('./src/controllers/authController');
  updateCover(req, res);
});

app.get('/api/cover/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT cover_url FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].cover_url) {
      return res.status(404).json({ error: 'Cover not found' });
    }

    res.redirect(result.rows[0].cover_url);
  } catch (error) {
    console.error('Get cover error:', error);
    res.status(500).json({ error: 'Failed to get cover' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const activeUsers = new Map();
const activeCalls = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_online', (userId) => {
    activeUsers.set(userId, socket.id);
    console.log(`User ${userId} is online with socket ${socket.id}`);
  });

  socket.on('typing', ({ userId, receiverId }) => {
    const receiverSocketId = activeUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { userId });
    }
  });

  socket.on('stop_typing', ({ userId, receiverId }) => {
    const receiverSocketId = activeUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing', { userId });
    }
  });

  socket.on('call_user', ({ callerId, callerName, receiverId }) => {
    const receiverSocketId = activeUsers.get(receiverId);
    if (receiverSocketId) {
      activeCalls.set(callerId, receiverId);
      io.to(receiverSocketId).emit('incoming_call', {
        callerId,
        callerName,
        callId: `${callerId}-${receiverId}-${Date.now()}`
      });
      console.log(`Call from ${callerId} to ${receiverId}`);
    } else {
      socket.emit('user_offline');
    }
  });

  socket.on('accept_call', ({ callerId, receiverId }) => {
    const callerSocketId = activeUsers.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call_accepted', { receiverId });
      console.log(`Call accepted by ${receiverId}`);
    }
  });

  socket.on('reject_call', ({ callerId }) => {
    const callerSocketId = activeUsers.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call_rejected');
      console.log(`Call rejected`);
    }
    activeCalls.delete(callerId);
  });

  socket.on('end_call', ({ userId, otherUserId }) => {
    const otherSocketId = activeUsers.get(otherUserId);
    if (otherSocketId) {
      io.to(otherSocketId).emit('call_ended');
    }
    activeCalls.delete(userId);
    activeCalls.delete(otherUserId);
    console.log(`Call ended between ${userId} and ${otherUserId}`);
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        activeCalls.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  
  autoReactionService.start().catch(err => {
    console.error('❌ Failed to start Auto Reaction Service:', err);
  });
  
  if (process.env.RENDER_EXTERNAL_URL) {
    const axios = require('axios');
    const backendUrl = `${process.env.RENDER_EXTERNAL_URL}/health`;
    const webAppUrl = process.env.WEB_APP_URL;
    const interval = 14 * 60 * 1000;
    
    console.log(`🔄 Render Anti-Spindown activated`);
    console.log(`📡 Backend: Pinging ${backendUrl} every 14 minutes`);
    
    if (webAppUrl) {
      console.log(`📡 Web App: Pinging ${webAppUrl} every 14 minutes`);
    }
    
    function keepAlive() {
      axios.get(backendUrl, { timeout: 30000 })
        .then(response => {
          console.log(`✅ Backend keep-alive ping successful at ${new Date().toISOString()}`);
        })
        .catch(error => {
          console.error(`❌ Backend keep-alive error at ${new Date().toISOString()}:`, error.message);
        });
      
      if (webAppUrl) {
        axios.get(webAppUrl, { timeout: 30000 })
          .then(response => {
            console.log(`✅ Web App keep-alive ping successful at ${new Date().toISOString()}`);
          })
          .catch(error => {
            console.error(`❌ Web App keep-alive error at ${new Date().toISOString()}:`, error.message);
          });
      }
    }
    
    setInterval(keepAlive, interval);
    
    setTimeout(keepAlive, 5000);
  }
});
