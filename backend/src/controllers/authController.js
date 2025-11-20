const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, full_name } = req.body;

  try {
    const existsResults = await pool.queryBoth(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    const existsInPrimary = existsResults.primary && existsResults.primary.rows.length > 0;
    const existsInSecondary = existsResults.secondary && existsResults.secondary.rows.length > 0;

    if (existsInPrimary || existsInSecondary) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name, avatar_url, cover_url, bio, is_verified, created_at',
      [username, email, password_hash, full_name]
    );

    const user = result.rows[0];
    const token = jwt.sign({ 
      id: user.id, 
      username: user.username,
      dbSource: 'primary'
    }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const results = await pool.queryBoth(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    let user = null;
    let dbSource = null;

    if (results.primary && results.primary.rows.length > 0) {
      user = results.primary.rows[0];
      dbSource = 'primary';
    } else if (results.secondary && results.secondary.rows.length > 0) {
      user = results.secondary.rows[0];
      dbSource = 'secondary';
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`✅ User ${username} logged in from ${dbSource} database`);

    const token = jwt.sign({ 
      id: user.id, 
      username: user.username,
      dbSource: dbSource
    }, JWT_SECRET, { expiresIn: '7d' });

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const dbSource = req.user.dbSource || 'primary';
    let result;
    
    if (dbSource === 'primary') {
      result = await pool.primary.query(
        'SELECT id, username, email, full_name, avatar_url, cover_url, bio, is_verified, created_at FROM users WHERE id = $1',
        [req.user.id]
      );
    } else {
      result = await pool.secondary.query(
        'SELECT id, username, email, full_name, avatar_url, cover_url, bio, is_verified, created_at FROM users WHERE id = $1',
        [req.user.id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  const { full_name, bio } = req.body;
  const userId = req.user.id;
  const dbSource = req.user.dbSource || 'primary';

  try {
    let result;
    
    if (dbSource === 'primary') {
      result = await pool.primary.query(
        'UPDATE users SET full_name = $1, bio = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, username, email, full_name, avatar_url, cover_url, bio, is_verified, created_at',
        [full_name, bio, userId]
      );
    } else {
      result = await pool.secondary.query(
        'UPDATE users SET full_name = $1, bio = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, username, email, full_name, avatar_url, cover_url, bio, is_verified, created_at',
        [full_name, bio, userId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateAvatar = async (req, res) => {
  const userId = req.user.id;
  const dbSource = req.user.dbSource || 'primary';

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'avatars',
          public_id: `avatar_${userId}`,
          overwrite: true,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    let result;
    
    if (dbSource === 'primary') {
      result = await pool.primary.query(
        'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
        [uploadResult.secure_url, userId]
      );
    } else {
      result = await pool.secondary.query(
        'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
        [uploadResult.secure_url, userId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      avatar_url: uploadResult.secure_url,
      type: req.file.mimetype
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateCover = async (req, res) => {
  const userId = req.user.id;
  const dbSource = req.user.dbSource || 'primary';

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'covers',
          public_id: `cover_${userId}`,
          overwrite: true,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    let result;
    
    if (dbSource === 'primary') {
      result = await pool.primary.query(
        'UPDATE users SET cover_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
        [uploadResult.secure_url, userId]
      );
    } else {
      result = await pool.secondary.query(
        'UPDATE users SET cover_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
        [uploadResult.secure_url, userId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      cover_url: uploadResult.secure_url,
      type: req.file.mimetype
    });
  } catch (error) {
    console.error('Update cover error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login, getProfile, updateProfile, updateAvatar, updateCover };
