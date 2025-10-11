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

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

app.use('/uploads', express.static('uploads'));

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

app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
