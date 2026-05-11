const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// Áp dụng verifyToken để bảo vệ route lấy danh sách người dùng
router.get('/', verifyToken, userController.getUsers);

module.exports = router;
