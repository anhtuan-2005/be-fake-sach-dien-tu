import express, { Router } from 'express';
import classController from '../controllers/classController';
import { verifyToken, checkRole } from '../middleware/authMiddleware';

const router: Router = express.Router();

// Tất cả các route dành cho giáo viên đều yêu cầu đăng nhập và có quyền 'teacher' hoặc 'admin'
router.use(verifyToken);
router.use(checkRole(['teacher', 'admin']));

router.get('/classes', classController.getClasses);
router.post('/classes', classController.createClass);

export default router;
