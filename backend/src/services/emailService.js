const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (email, otpCode, userName) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Shatter <onboarding@resend.dev>',
      to: [email],
      subject: 'Mã xác minh đổi mật khẩu - Shatter',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 16px;
              padding: 40px;
              text-align: center;
            }
            .logo {
              font-size: 36px;
              font-weight: 900;
              color: #fff;
              margin-bottom: 20px;
              letter-spacing: -0.5px;
            }
            .content {
              background: white;
              border-radius: 12px;
              padding: 30px;
              margin-top: 20px;
            }
            .greeting {
              font-size: 20px;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .otp-code {
              font-size: 48px;
              font-weight: 700;
              color: #667eea;
              letter-spacing: 8px;
              margin: 30px 0;
              padding: 20px;
              background: #f3f4f6;
              border-radius: 12px;
              display: inline-block;
            }
            .info {
              color: #6b7280;
              font-size: 14px;
              margin-top: 20px;
            }
            .warning {
              color: #ef4444;
              font-size: 13px;
              margin-top: 15px;
              padding: 15px;
              background: #fef2f2;
              border-radius: 8px;
            }
            .footer {
              color: #fff;
              font-size: 12px;
              margin-top: 20px;
              opacity: 0.8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Shatter</div>
            <div class="content">
              <div class="greeting">Xin chào ${userName || 'bạn'}!</div>
              <p>Bạn đã yêu cầu đổi mật khẩu tài khoản. Đây là mã xác minh OTP của bạn:</p>
              <div class="otp-code">${otpCode}</div>
              <div class="info">
                ⏰ Mã này sẽ hết hạn sau <strong>5 phút</strong>
              </div>
              <div class="warning">
                ⚠️ <strong>Lưu ý bảo mật:</strong> Không chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này và liên hệ với chúng tôi ngay.
              </div>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} Shatter - Mạng xã hội kết nối mọi người
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      // In development/test mode, allow OTP to work even if email fails
      if (error.statusCode === 403 && error.name === 'validation_error') {
        console.warn('⚠️ Email service in test mode - OTP code created but email not sent. Code:', otpCode);
        return { success: true, testMode: true, message: 'Test mode: OTP created but email not sent' };
      }
      throw new Error('Failed to send OTP email');
    }

    console.log('✅ OTP email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw error;
  }
};

const sendPasswordChangedNotification = async (email, userName) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Shatter <onboarding@resend.dev>',
      to: [email],
      subject: 'Mật khẩu đã được thay đổi - Shatter',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 16px;
              padding: 40px;
              text-align: center;
            }
            .logo {
              font-size: 36px;
              font-weight: 900;
              color: #fff;
              margin-bottom: 20px;
            }
            .content {
              background: white;
              border-radius: 12px;
              padding: 30px;
              margin-top: 20px;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 24px;
              color: #1f2937;
              font-weight: 700;
              margin-bottom: 15px;
            }
            .message {
              color: #6b7280;
              font-size: 15px;
              margin: 15px 0;
            }
            .warning {
              color: #ef4444;
              font-size: 13px;
              margin-top: 20px;
              padding: 15px;
              background: #fef2f2;
              border-radius: 8px;
            }
            .footer {
              color: #fff;
              font-size: 12px;
              margin-top: 20px;
              opacity: 0.8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Shatter</div>
            <div class="content">
              <div class="icon">✅</div>
              <div class="title">Mật khẩu đã được thay đổi thành công</div>
              <p class="message">
                Xin chào ${userName || 'bạn'},<br><br>
                Mật khẩu tài khoản của bạn đã được thay đổi thành công vào lúc ${new Date().toLocaleString('vi-VN')}.
              </p>
              <div class="warning">
                ⚠️ Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức để bảo vệ tài khoản của bạn.
              </div>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} Shatter - Mạng xã hội kết nối mọi người
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error('Failed to send notification email');
    }

    console.log('✅ Password changed notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending notification email:', error);
    throw error;
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordChangedNotification,
};
