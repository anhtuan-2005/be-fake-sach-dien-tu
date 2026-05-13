import express, { Router } from 'express';
import userController from '../controllers/userController';
import { verifyToken } from '../middleware/authMiddleware';

const router: Router = express.Router();

// Áp dụng verifyToken để bảo vệ route lấy danh sách người dùng
router.get('/', verifyToken, userController.getUsers);

// Lấy chi tiết một người dùng (Cần token)
router.get('/:id', verifyToken, userController.getUserById);

export default router;
