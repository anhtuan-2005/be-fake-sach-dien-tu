import { Request, Response } from 'express';
import User from '../models/userModel';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
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
      let userData: UserInterface | null = null;

      // 1. Kiểm tra tài khoản test cố định
      if (email === 'testitdn@gmail.com' && password === 'sachso') {
        userData = {
          id: 0,
          user_code: 'ADMIN',
          full_name: 'Người dùng Test',
          account_type: 'Admin',
          level: null,
          province_id: null,
          ward_id: null,
          school_id: null,
          email: email,
          password: password,
          phone: null,
          status: 1,
          role: 'admin',
          created_at: new Date()
        };
      } else {
        // 2. Kiểm tra trong database
        const user = await User.findByEmail(email);
        // Lưu ý: Trong thực tế nên dùng bcrypt.compare
        if (user && user.password === password) {
          userData = user;
        }
      }

      if (userData) {
        const accessToken = generateAccessToken(userData);
        const refreshToken = generateRefreshToken(userData);

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const response: ApiResponse<{ accessToken: string; user: UserInterface }> = {
          success: true,
          message: 'Đăng nhập thành công',
          data: {
            accessToken,
            user: userData
          }
        };

        res.status(200).json(response);
        return;
      }

      const failResponse: ApiResponse = {
        success: false,
        message: 'Email hoặc mật khẩu không chính xác'
      };
      res.status(401).json(failResponse);

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
  }
};

export default authController;
