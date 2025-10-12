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
const notificationRoutes = require('./src/routes/notifications');
const userRoutes = require('./src/routes/users');
const { authenticateToken } = require('./src/middleware/auth');
const pool = require('./src/config/database');
const cloudinary = require('./src/config/cloudinary');

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

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/friendships', friendshipRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

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

    const result = await pool.query(
      'INSERT INTO posts (user_id, media_url, media_type) VALUES ($1, $2, $3) RETURNING id',
      [req.user.id, uploadResult.secure_url, mediaType]
    );

    const mediaId = result.rows[0].id;
    console.log(`Media uploaded successfully to Cloudinary with post ID: ${mediaId}`);
    
    res.json({ 
      id: mediaId,
      url: uploadResult.secure_url,
      type: mediaType
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
      'SELECT media_data, media_type FROM posts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0 || !result.rows[0].media_data) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const { media_data, media_type } = result.rows[0];
    res.set('Content-Type', media_type);
    res.send(media_data);
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
      'SELECT avatar_data, avatar_type FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].avatar_data) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    const { avatar_data, avatar_type } = result.rows[0];
    res.set('Content-Type', avatar_type);
    res.send(avatar_data);
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
      'SELECT cover_data, cover_type FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].cover_data) {
      return res.status(404).json({ error: 'Cover not found' });
    }

    const { cover_data, cover_type } = result.rows[0];
    res.set('Content-Type', cover_type);
    res.send(cover_data);
  } catch (error) {
    console.error('Get cover error:', error);
    res.status(500).json({ error: 'Failed to get cover' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
