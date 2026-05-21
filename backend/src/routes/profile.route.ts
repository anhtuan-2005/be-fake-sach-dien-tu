import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { verifyToken } from '../middleware/authMiddleware';
import { uploadAvatar } from '../middleware/uploadMiddleware';

const router = Router();

/**
 * Route cho Profile và Auth liên quan đến Profile
 * Tuân thủ yêu cầu: 
 * 1. POST /api/users/upload-avatar
 * 2. PUT /api/users/:id
 * 3. PUT /api/auth/change-password
 */

// Cập nhật thông tin cá nhân
router.put('/users/:id', verifyToken, ProfileController.updateProfile);

// Tải ảnh đại diện
router.post('/users/upload-avatar', verifyToken, uploadAvatar.single('avatar'), ProfileController.uploadAvatar);

// Đổi mật khẩu
router.put('/auth/change-password', verifyToken, ProfileController.changePassword);

export default router;
