import express, { Router } from 'express';
import authController from '../controllers/authController';
import { verifyToken } from '../middleware/authMiddleware';

const router: Router = express.Router();

router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.getMe);

export default router;
