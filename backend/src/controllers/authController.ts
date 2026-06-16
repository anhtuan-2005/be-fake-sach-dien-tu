import { Request, Response } from 'express';
import User from '../models/userModel';
import bcrypt from 'bcrypt';
import { ApiResponse, LoginDto } from '../types';
import { AuthService } from '../services/authService';

/**
 * Controller xử lý các logic xác thực (Đăng nhập, Logout, Refresh Token)
 */
const authController = {
  /**
   * Xử lý đăng nhập
   */
  login: async (req: Request, res: Response): Promise<void> => {
    const { email, password }: LoginDto = req.body;

    try {
      // Gọi AuthService xử lý logic nghiệp vụ
      const { user, accessToken, refreshToken } = await AuthService.login({ email, password });

      // Lưu Refresh Token vào HttpOnly Cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          accessToken,
          user
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Email hoặc mật khẩu không chính xác'
      });
    }
  },

  /**
   * Cấp lại Access Token mới từ Refresh Token
   */
  refreshToken: async (req: Request, res: Response): Promise<void> => {
    const refreshToken: string | undefined = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ 
        success: false, 
        message: 'Không tìm thấy Refresh Token' 
      });
      return;
    }

    try {
      const newAccessToken = await AuthService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        data: { accessToken: newAccessToken }
      });
    } catch (error: any) {
      res.status(403).json({ 
        success: false, 
        message: 'Refresh Token không hợp lệ hoặc đã hết hạn',
        error: error.message
      });
    }
  },

  /**
   * Đăng xuất và xóa cookie
   */
  logout: (req: Request, res: Response): void => {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
    res.status(200).json({ 
      success: true, 
      message: 'Đã đăng xuất' 
    });
  },

  /**
   * Lấy thông tin hồ sơ mới nhất (Live Data)
   */
  getMe: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Chưa xác thực' });
        return;
      }

      const user = await User.getById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        return;
      }

      // Không trả về mật khẩu
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        data: userWithoutPassword
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin', error: error.message });
    }
  },

  /**
   * Đổi mật khẩu
   */
  changePassword: async (req: Request, res: Response): Promise<void> => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
        return;
      }

      const user = await User.getById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        return;
      }

      // Kiểm tra mật khẩu cũ
      let isMatch = false;
      if (user.password && user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(oldPassword, user.password);
      } else {
        isMatch = user.password === oldPassword;
      }

      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác' });
        return;
      }

      // Mã hóa mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Cập nhật vào DB
      await User.updatePassword(userId, hashedPassword);

      res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi đổi mật khẩu', error: error.message });
    }
  }
};

export default authController;
