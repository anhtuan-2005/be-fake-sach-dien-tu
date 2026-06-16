import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

/**
 * Middleware để validate request body bằng Class DTO và class-validator
 */
export function validateDto(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Chuẩn hóa các trường chuỗi rỗng thành null để tránh lỗi kiểu dữ liệu ở Database
      if (req.body) {
        if (req.body.parent_id === '') {
          req.body.parent_id = null;
        }
        if (req.body.vietnamese_title === '') {
          req.body.vietnamese_title = null;
        }
        if (req.body.answer_type_code === '') {
          req.body.answer_type_code = null;
        }
        if (req.body.skill === '') {
          req.body.skill = null;
        }
      }

      // Chuyển đổi req.body thành instance của class DTO
      const dtoInstance = plainToInstance(dtoClass, req.body);
      
      // Tiến hành validate
      const errors = await validate(dtoInstance);
      
      if (errors.length > 0) {
        // Thu thập toàn bộ các câu báo lỗi từ các constraints
        const errorMessages = errors.flatMap((error) => 
          Object.values(error.constraints || {})
        );
        
        res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ.',
          errors: errorMessages
        });
        return;
      }
      
      // Gán body đã validate/transform lại cho req.body
      req.body = dtoInstance;
      next();
    } catch (error: any) {
      console.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi kiểm tra dữ liệu đầu vào.'
      });
    }
  };
}
