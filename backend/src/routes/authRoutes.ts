import express, { Router } from 'express';
import authController from '../controllers/authController';

const router: Router = express.Router();

router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

export default router;
