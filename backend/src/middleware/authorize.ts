import { Request, Response, NextFunction } from 'express';

/**
 * Middleware phân quyền (Role-based Access Control)
 * So sánh case-insensitive vai trò của người dùng với danh sách các vai trò được phép
 * @param allowedRoles Danh sách các role được phép truy cập (ví dụ: ['admin', 'teacher'])
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    // 1. Kiểm tra xem token đã được xác thực trước đó chưa (req.user phải tồn tại)
    if (!req.user) {
      console.warn('[Authorize] Unauthorized - User info not found in request context.');
      return res.status(401).json({
        success: false,
        message: 'Người dùng chưa được xác thực.'
      });
    }

    const userRole = req.user.role;
    if (!userRole) {
      console.warn('[Authorize] Forbidden - Role field is missing from decoded token payload.');
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập vùng này.'
      });
    }

    // 2. Kiểm tra quyền truy cập (không phân biệt chữ hoa/chữ thường)
    const hasPermission = allowedRoles.some(role => 
      role.trim().toLowerCase() === userRole.trim().toLowerCase()
    );

    if (!hasPermission) {
      console.warn(`[Authorize] Forbidden - User role "${userRole}" is not allowed to access resources requiring: [${allowedRoles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập vùng này.'
      });
    }

    // 3. Cho phép đi tiếp
    next();
  };
};
