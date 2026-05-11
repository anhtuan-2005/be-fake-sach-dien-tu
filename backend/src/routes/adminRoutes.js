const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Áp dụng verifyToken cho tất cả các route trong file này
// và kiểm tra role là 'admin'
router.use(verifyToken, checkRole(['admin']));

// Lấy danh sách tất cả người dùng (Chỉ admin)
router.get('/users', userController.getUsers);

// Các route admin khác có thể mở rộng thêm ở đây
// Ví dụ:
// router.delete('/users/:id', userController.deleteUser);
// router.put('/users/:id', userController.updateUser);
// router.get('/statistics', adminController.getStatistics);

module.exports = router;
