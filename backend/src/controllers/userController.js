const User = require('../models/userModel');

const userController = {
  getUsers: async (req, res) => {
    try {
      const users = await User.getAll();
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách người dùng'
      });
    }
  }
};

module.exports = userController;
