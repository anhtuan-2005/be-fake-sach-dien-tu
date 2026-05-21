import { Request, Response } from 'express';
import { ProfileService } from '../services/profile.service';
import { 
  validateUpdateProfile, 
  validateChangePassword, 
  UpdateProfileDto, 
  ChangePasswordDto 
} from '../dtos/profile.dto';

/**
 * Controller tiếp nhận Request và điều phối Service
 */
export class ProfileController {
  /**
   * API Cập nhật thông tin (PUT /api/users/:id)
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id as string);
      const data: UpdateProfileDto = req.body;

      // 1. Validate DTO
      const validation = validateUpdateProfile(data);
      if (!validation.isValid) {
        res.status(400).json({ success: false, message: validation.message });
        return;
      }

      // 2. Gọi Service
      const updatedUser = await ProfileService.updateProfile(userId, data);
      
      if (updatedUser) {
        res.status(200).json({
          success: true,
          message: 'Cập nhật thông tin thành công',
          data: updatedUser
        });
      } else {
        res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      }
    } catch (error: any) {
      console.error('Update Profile Controller Error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật profile' });
    }
  }

  /**
   * API Tải ảnh đại diện (POST /api/users/upload-avatar)
   */
  static async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      // req.user được gán từ authMiddleware
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });
        return;
      }
      
      const file = (req as any).file;
      
      if (!file) {
        res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh để tải lên' });
        return;
      }

      const avatarUrl = `/uploads/avatars/${file.filename}`;
      
      const success = await ProfileService.updateAvatar(userId, avatarUrl);
      
      if (success) {
        res.status(200).json({
          success: true,
          message: 'Tải ảnh đại diện thành công',
          data: {
            url: avatarUrl
          }
        });
      } else {
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật ảnh đại diện vào database' });
      }
    } catch (error: any) {
      console.error('Upload Avatar Controller Error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi upload ảnh' });
    }
  }

  /**
   * API Đổi mật khẩu (PUT /api/auth/change-password)
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });
        return;
      }

      const data: ChangePasswordDto = req.body;

      // 1. Validate DTO
      const validation = validateChangePassword(data);
      if (!validation.isValid) {
        res.status(400).json({ success: false, message: validation.message });
        return;
      }

      // 2. Gọi Service xử lý logic bảo mật
      const result = await ProfileService.changePassword(userId, data);
      
      if (result.success) {
        res.status(200).json({ success: true, message: result.message });
      } else {
        res.status(400).json({ success: false, message: result.message });
      }
    } catch (error: any) {
      console.error('Change Password Controller Error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi đổi mật khẩu' });
    }
  }
}
