import { Request, Response } from 'express';
import { ExerciseTypeService } from './exercise-type.service';
import { createActivityLog } from '../../utils/logger';

export const ExerciseTypeController = {
  /**
   * GET /exercise-types
   * Lấy cấu trúc cây toàn bộ loại bài tập
   */
  findAll: async (req: Request, res: Response): Promise<void> => {
    try {
      const treeData = await ExerciseTypeService.findAll();
      res.status(200).json({
        success: true,
        message: 'Lấy cấu trúc cây loại bài tập thành công.',
        data: treeData
      });
    } catch (error: any) {
      console.error('ExerciseTypeController.findAll error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tải danh sách loại bài tập.',
        error: error.message
      });
    }
  },

  /**
   * GET /exercise-types/:id
   * Lấy chi tiết một loại bài tập bằng ID
   */
  findOne: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Mã ID loại bài tập không hợp lệ.'
        });
        return;
      }
      const record = await ExerciseTypeService.findOne(id);
      res.status(200).json({
        success: true,
        message: 'Lấy chi tiết loại bài tập thành công.',
        data: record
      });
    } catch (error: any) {
      console.error('ExerciseTypeController.findOne error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Lỗi server khi lấy chi tiết loại bài tập.'
      });
    }
  },

  /**
   * POST /exercise-types
   * Tạo mới một loại bài tập
   */
  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      const record = await ExerciseTypeService.create(req.body);

      // Ghi nhận lịch sử hoạt động vào log hệ thống
      await createActivityLog({
        userId,
        userEmail,
        action: 'CREATE',
        description: `Tạo mới loại bài tập ID: ${record.id} - Name: ${record.name} - Code: ${record.code}`,
        newValues: record
      });

      res.status(201).json({
        success: true,
        message: 'Tạo loại bài tập mới thành công.',
        data: record
      });
    } catch (error: any) {
      console.error('ExerciseTypeController.create error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Lỗi server khi tạo loại bài tập mới.'
      });
    }
  },

  /**
   * PUT /exercise-types/:id
   * Cập nhật thông tin loại bài tập theo ID
   */
  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Mã ID loại bài tập không hợp lệ.'
        });
        return;
      }

      // Lấy thông tin cũ để làm log lịch sử
      const oldRecord = await ExerciseTypeService.findOne(id);
      const updatedRecord = await ExerciseTypeService.update(id, req.body);

      // Ghi nhận lịch sử hoạt động cập nhật
      await createActivityLog({
        userId,
        userEmail,
        action: 'UPDATE',
        description: `Cập nhật loại bài tập ID: ${id}`,
        oldValues: oldRecord,
        newValues: updatedRecord
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật loại bài tập thành công.',
        data: updatedRecord
      });
    } catch (error: any) {
      console.error('ExerciseTypeController.update error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Lỗi server khi cập nhật loại bài tập.'
      });
    }
  },

  /**
   * DELETE /exercise-types/:id
   * Xóa một loại bài tập theo ID
   */
  remove: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Mã ID loại bài tập không hợp lệ.'
        });
        return;
      }

      // Lấy dữ liệu trước khi xóa để làm log
      const oldRecord = await ExerciseTypeService.findOne(id);
      await ExerciseTypeService.remove(id);

      // Ghi nhận hoạt động xóa loại bài tập
      await createActivityLog({
        userId,
        userEmail,
        action: 'DELETE',
        description: `Xóa loại bài tập ID: ${id} - Name: ${oldRecord.name}`,
        oldValues: oldRecord
      });

      res.status(200).json({
        success: true,
        message: 'Xóa loại bài tập thành công.'
      });
    } catch (error: any) {
      console.error('ExerciseTypeController.remove error:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Lỗi server khi xóa loại bài tập.'
      });
    }
  }
};
