const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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
            role: user.role || 'user' // Sử dụng cột role mới thêm
          };
        }
      }

      // Nếu tìm thấy user hợp lệ
      if (userData) {
        // Tạo JWT Token (thời hạn 24h)
        const token = jwt.sign(
          { id: userData.id, email: userData.email, role: userData.role },
          process.env.JWT_SECRET || 'fallback_secret',
          { expiresIn: '24h' }
        );

        return res.status(200).json({
          success: true,
          message: 'Đăng nhập thành công',
          token: token,
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
  }
};

module.exports = authController;
