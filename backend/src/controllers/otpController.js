const pool = require('../db');
const { sendOTPEmail, sendPasswordChangedNotification } = require('../services/emailService');
const bcrypt = require('bcrypt');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const userResult = await pool.query(
      'SELECT id, email, full_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const user = userResult.rows[0];
    
    if (!user.email) {
      return res.status(400).json({ error: 'Tài khoản chưa có email' });
    }

    await pool.query(
      'UPDATE otp_codes SET verified = true WHERE user_id = $1 AND purpose = $2 AND verified = false',
      [userId, 'password_reset']
    );

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'INSERT INTO otp_codes (user_id, email, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [userId, user.email, otpCode, 'password_reset', expiresAt]
    );

    await sendOTPEmail(user.email, otpCode, user.full_name);

    console.log(`✅ OTP sent to user ${userId} (${user.email})`);

    res.json({
      success: true,
      message: 'Mã OTP đã được gửi đến email của bạn',
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      expiresIn: 300
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Không thể gửi mã OTP. Vui lòng thử lại sau.' });
  }
};

const verifyOTP = async (req, res) => {
  const userId = req.user.id;
  const { otpCode } = req.body;

  if (!otpCode) {
    return res.status(400).json({ error: 'Vui lòng nhập mã OTP' });
  }

  try {
    const result = await pool.query(
      `SELECT id, expires_at, verified 
       FROM otp_codes 
       WHERE user_id = $1 
         AND otp_code = $2 
         AND purpose = $3 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId, otpCode, 'password_reset']
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Mã OTP không đúng' });
    }

    const otpRecord = result.rows[0];

    if (otpRecord.verified) {
      return res.status(400).json({ error: 'Mã OTP đã được sử dụng' });
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' });
    }

    await pool.query(
      'UPDATE otp_codes SET verified = true WHERE id = $1',
      [otpRecord.id]
    );

    console.log(`✅ OTP verified successfully for user ${userId}`);

    res.json({
      success: true,
      message: 'Xác minh OTP thành công',
      otpId: otpRecord.id
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Không thể xác minh OTP. Vui lòng thử lại sau.' });
  }
};

const changePasswordWithOTP = async (req, res) => {
  const userId = req.user.id;
  const { otpCode, newPassword } = req.body;

  if (!otpCode || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }

  try {
    const otpResult = await pool.query(
      `SELECT id, expires_at, verified 
       FROM otp_codes 
       WHERE user_id = $1 
         AND otp_code = $2 
         AND purpose = $3
         AND verified = true
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId, otpCode, 'password_reset']
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'Mã OTP không hợp lệ hoặc chưa được xác minh' });
    }

    const otpRecord = otpResult.rows[0];

    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ error: 'Mã OTP đã hết hạn' });
    }

    const userResult = await pool.query(
      'SELECT email, full_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const user = userResult.rows[0];

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    await pool.query(
      'DELETE FROM otp_codes WHERE user_id = $1 AND purpose = $2',
      [userId, 'password_reset']
    );

    if (user.email) {
      try {
        await sendPasswordChangedNotification(user.email, user.full_name);
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }
    }

    console.log(`✅ Password changed successfully for user ${userId}`);

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Không thể đổi mật khẩu. Vui lòng thử lại sau.' });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  changePasswordWithOTP,
};
