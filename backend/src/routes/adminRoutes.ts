import express, { Router } from 'express';
import userController from '../controllers/userController';
import { verifyToken, checkRole } from '../middleware/authMiddleware';

const router: Router = express.Router();

// Áp dụng verifyToken cho tất cả các route trong file này
// và kiểm tra role là 'admin'
router.use(verifyToken, checkRole(['admin']));

// Lấy danh sách tất cả người dùng (Chỉ admin)
router.get('/users', userController.getUsers);

export default router;
