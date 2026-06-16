import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { JWTPayload } from '../types';
import db from '../config/db';

dotenv.config();

// Giữ lại AuthRequest để không làm gãy các code cũ đang import nó
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// Hàm giải mã JWT và lấy dữ liệu sống từ DB
export const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn(`[Auth] 401 Unauthorized: No token provided for ${req.originalUrl}`);
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy token. Truy cập bị từ chối.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JWTPayload;
    
    // --- LẤY DỮ LIỆU SỐNG TỪ DB ---
    // Sau khi giải mã userId, truy vấn DB để lấy thông tin mới nhất
    // Sử dụng deleted_at IS NULL thay vì status=1 (vì bảng users dùng soft delete)
    const [rows]: any = await db.query(
      'SELECT id, full_name, email, role, level FROM users WHERE id = ? AND deleted_at IS NULL',
      [decoded.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại hoặc đã bị khóa.'
      });
    }

    const liveUser = rows[0];

    // Ghi đè thông tin từ DB vào req.user (đảm bảo role, level luôn mới nhất)
    req.user = {
      ...decoded,
      full_name: liveUser.full_name,
      role: liveUser.role,
      level: liveUser.level
    };
    
    next();
  } catch (error: any) {
    console.error(`[Auth] JWT Verify Error for ${req.originalUrl}:`, error.message);
    
    // Phân biệt lỗi hết hạn để Frontend dễ xử lý Silent Refresh
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'TOKEN_EXPIRED',
        error: 'Access token đã hết hạn'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
    });
  }
};

// Middleware kiểm tra quyền truy cập dựa trên role
export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    // Debug: Kiểm tra req.user có tồn tại không và role là gì
    console.log('[Auth] Checking role for user:', req.user);
    console.log('[Auth] Allowed roles:', allowedRoles);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng chưa được xác thực.'
      });
    }

    const userRole = req.user.role;

    // Chuyển cả hai về lowercase để so sánh không phân biệt hoa thường
    // Điều này fix lỗi 'Admin' vs 'admin'
    const hasPermission = allowedRoles.some(role => 
      role.toLowerCase() === userRole.toLowerCase()
    );

    if (!hasPermission) {
      console.log(`[Auth] Forbidden: User role "${userRole}" not in allowed roles:`, allowedRoles);
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập vùng này.'
      });
    }

    next();
  };
};
