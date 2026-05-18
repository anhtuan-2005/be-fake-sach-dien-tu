import express, { Router } from 'express';
import userController from '../controllers/userController';
import activityLogController from '../controllers/activityLogController';
import { verifyToken, checkRole } from '../middleware/authMiddleware';

const router: Router = express.Router();

// Áp dụng verifyToken cho tất cả các route trong file này
// và kiểm tra role là 'admin'
router.use(verifyToken, checkRole(['admin']));

// Lấy danh sách tất cả người dùng (Chỉ admin)
router.get('/users', userController.getUsers);

// Lấy lịch sử thao tác
router.get('/activity-logs', activityLogController.getLogs);

// Tạo người dùng mới
router.post('/users', userController.createUser);

// Cập nhật người dùng
router.put('/users/:id', userController.updateUser);

// Xóa mềm người dùng (Chuyển vào thùng rác)
router.delete('/users/:id', userController.softDeleteUser);

// Khôi phục người dùng
router.post('/users/:id/restore', userController.restoreUser);

export default router;
