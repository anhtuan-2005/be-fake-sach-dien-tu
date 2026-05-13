import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { JWTPayload } from '../types';

dotenv.config();

// Declaration Merging để mở rộng kiểu Request của Express toàn cục
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Giữ lại AuthRequest để không làm gãy các code cũ đang import nó
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// Hàm giải mã JWT
export const verifyToken = (req: Request, res: Response, next: NextFunction): any => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('[Auth] No token found in headers');
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy token. Truy cập bị từ chối.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JWTPayload;
    
    // Debug: Kiểm tra payload sau khi giải mã
    console.log('[Auth] Decoded Token Payload:', decoded);
    
    req.user = decoded;
    next();
  } catch (error: any) {
    console.error('[Auth] JWT Verify Error:', error.message);
    return res.status(403).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn.'
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
