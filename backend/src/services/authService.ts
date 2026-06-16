import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db';
import { LoginDto, User as UserInterface, JWTPayload } from '../types';

export class AuthService {
  /**
   * Tạo Access Token (hết hạn sau 15 phút)
   * Payload chứa: id, email, role, level
   */
  static generateAccessToken(user: Partial<UserInterface>): string {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role || 'student', 
        level: user.level || null 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '15m' }
    );
  }

  /**
   * Tạo Refresh Token (hết hạn sau 7 ngày)
   */
  static generateRefreshToken(user: Partial<UserInterface>): string {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role || 'student', 
        level: user.level || null 
      },
      process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
      { expiresIn: '7d' }
    );
  }

  /**
   * Xử lý xác thực đăng nhập
   */
  static async login(dto: LoginDto): Promise<{ user: UserInterface; accessToken: string; refreshToken: string }> {
    // 1. Tìm kiếm user trong database theo email
    const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [dto.email]);
    const user = rows[0] as UserInterface | undefined;

    if (!user) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    // 2. Kiểm tra trạng thái xóa mềm
    if ((user as any).deleted_at) {
      throw new Error('Tài khoản của bạn đã bị khóa hoặc không còn tồn tại trên hệ thống.');
    }

    // 3. Kiểm tra mật khẩu
    let isMatch = false;
    if (user.password && user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(dto.password, user.password);
    } else {
      isMatch = user.password === dto.password;
    }

    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không chính xác');
    }

    // 4. Sinh Token
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  /**
   * Cấp lại access token mới từ refresh token
   */
  static async refreshAccessToken(token: string): Promise<string> {
    try {
      const decoded = jwt.verify(
        token, 
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret'
      ) as JWTPayload;

      const user: Partial<UserInterface> = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        level: decoded.level
      };

      return this.generateAccessToken(user);
    } catch (error) {
      throw new Error('Refresh Token không hợp lệ hoặc đã hết hạn');
    }
  }
}
