import { Request, Response } from 'express';
import User from '../models/userModel';
import db from '../config/db';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { ApiResponse, LoginDto, User as UserInterface, JWTPayload } from '../types';

dotenv.config();

/**
 * Tạo Access Token (hết hạn sau 15 phút)
 * @param {Partial<UserInterface>} user Thông tin người dùng
 * @returns {string} Token
 */
const generateAccessToken = (user: Partial<UserInterface>): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.account_type || 'Học sinh' },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '15m' }
  );
};

/**
 * Tạo Refresh Token (hết hạn sau 7 ngày)
 * @param {Partial<UserInterface>} user Thông tin người dùng
 * @returns {string} Token
 */
const generateRefreshToken = (user: Partial<UserInterface>): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.account_type || 'Học sinh' },
    process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
    { expiresIn: '7d' }
  );
};

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
      // 1. Tìm kiếm user trong database theo email (Lấy cả người đã xóa để kiểm tra trạng thái)
      // Sử dụng query trực tiếp để tránh bị UserModel filter deleted_at
      const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      const user = rows[0];
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác'
        });
        return;
      }

      // KIỂM TRA TRẠNG THÁI XÓA MỀM
      if (user.deleted_at) {
        res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đã bị khóa hoặc không còn tồn tại trên hệ thống.'
        });
        return;
      }

      // 2. Bắt buộc kiểm tra mật khẩu bằng bcrypt.compare
      // Hỗ trợ fallback cho mật khẩu plaintext cũ nếu cần, nhưng ưu tiên bcrypt
      let isMatch = false;
      if (user.password && user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        // Nếu DB vẫn còn mật khẩu chưa hash (giai đoạn chuyển đổi), so sánh trực tiếp
        isMatch = user.password === password;
      }

      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác'
        });
        return;
      }

      // 3. Tạo Token và trả về phản hồi thành công
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

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

    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorResponse: ApiResponse = {
        success: false,
        message: 'Lỗi hệ thống khi đăng nhập',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(errorResponse);
    }
  },

  /**
   * Cấp lại Access Token mới từ Refresh Token
   */
  refreshToken: async (req: Request, res: Response): Promise<void> => {
    const refreshToken: string | undefined = req.cookies.refreshToken;

    if (!refreshToken) {
      const response: ApiResponse = { success: false, message: 'Không tìm thấy Refresh Token' };
      res.status(401).json(response);
      return;
    }

    try {
      const decoded = jwt.verify(
        refreshToken, 
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret'
      ) as JWTPayload;
      
      const user: Partial<UserInterface> = {
        id: decoded.id,
        email: decoded.email,
        account_type: decoded.role as any
      };

      const newAccessToken = generateAccessToken(user);

      const response: ApiResponse<{ accessToken: string }> = {
        success: true,
        data: { accessToken: newAccessToken }
      };
      res.status(200).json(response);
    } catch (error: unknown) {
      const errorResponse: ApiResponse = { 
        success: false, 
        message: 'Refresh Token không hợp lệ hoặc đã hết hạn',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(403).json(errorResponse);
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
    const response: ApiResponse = { success: true, message: 'Đã đăng xuất' };
    res.status(200).json(response);
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
      // Lưu ý: Nếu DB đang lưu plaintext (như testitdn), cần handle cả 2 trường hợp
      let isMatch = false;
      if (user.password && user.password.startsWith('$2b$')) {
        // Mật khẩu đã được mã hóa bcrypt
        isMatch = await bcrypt.compare(oldPassword, user.password);
      } else {
        // Mật khẩu plaintext (cho các acc cũ/test)
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
