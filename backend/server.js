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
const { authenticateToken } = require('./src/middleware/auth');
const pool = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.post('/api/upload', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const mediaData = req.file.buffer;
    const mediaType = req.file.mimetype;
    
    const result = await pool.query(
      'INSERT INTO posts (user_id, media_data, media_type) VALUES ($1, $2, $3) RETURNING id',
      [req.user.id, mediaData, mediaType]
    );

    const mediaId = result.rows[0].id;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ 
      id: mediaId,
      url: `${baseUrl}/api/media/${mediaId}`,
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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
