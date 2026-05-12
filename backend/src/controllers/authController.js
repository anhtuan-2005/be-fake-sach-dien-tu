const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Hàm tạo Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '15m' } // Access Token ngắn hạn (15 phút)
  );
};

// Hàm tạo Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
    { expiresIn: '7d' } // Refresh Token dài hạn (7 ngày)
  );
};

const authController = {
  login: async (req, res) => {
    const { email, password } = req.body;

    try {
      let userData = null;

      // 1. Kiểm tra tài khoản test cố định
      if (email === 'testitdn@gmail.com' && password === 'sachso') {
        userData = {
          id: 0,
          full_name: 'Người dùng Test',
          email: email,
          role: 'admin'
        };
      } else {
        // 2. Kiểm tra trong database
        const user = await User.findByEmail(email);
        if (user && user.password === password) { // Lưu ý: Thực tế nên dùng bcrypt
          userData = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role || 'user'
          };
        }
      }

      // Nếu tìm thấy user hợp lệ
      if (userData) {
        const accessToken = generateAccessToken(userData);
        const refreshToken = generateRefreshToken(userData);

        // Lưu Refresh Token vào HTTP-Only Cookie
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // Chỉ gửi qua HTTPS khi deploy
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
        });

        return res.status(200).json({
          success: true,
          message: 'Đăng nhập thành công',
          accessToken: accessToken,
          user: userData
        });
      }

      // Nếu không khớp thông tin
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác'
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi đăng nhập'
      });
    }
  },

  refreshToken: async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Không tìm thấy Refresh Token' });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret');
      
      const user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };

      const newAccessToken = generateAccessToken(user);

      return res.status(200).json({
        success: true,
        accessToken: newAccessToken
      });
    } catch (error) {
      console.error('Refresh Token error:', error);
      return res.status(403).json({ success: false, message: 'Refresh Token không hợp lệ hoặc đã hết hạn' });
    }
  },

  logout: async (req, res) => {
    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: 'Đã đăng xuất' });
  }
};

module.exports = authController;
