import { Request, Response } from 'express';
import { QuestionService } from './question.service';
import { validateCreateQuestion, validateUpdateQuestion } from './question.dto';
import { createActivityLog } from '../../utils/logger';

export const QuestionController = {
  /**
   * Lấy danh sách câu hỏi phân trang & bộ lọc
   */
  getQuestions: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userLevel = req.user?.level; // Có thể lấy được nếu đã giải mã từ JWT Token
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Người dùng chưa được xác thực.'
        });
        return;
      }

      const { questions, pagination } = await QuestionService.getQuestions(
        userId,
        userLevel,
        req.query
      );

      res.status(200).json({
        success: true,
        message: 'Lấy danh sách câu hỏi thành công.',
        data: questions,
        pagination
      });
    } catch (error: any) {
      console.error('getQuestions controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách câu hỏi.',
        error: error.message
      });
    }
  },

  /**
   * Lấy danh sách các khối lớp khả dụng của Admin
   */
  getBlockClasses: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userLevel = req.user?.level;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Người dùng chưa được xác thực.'
        });
        return;
      }

      const classes = await QuestionService.getBlockClassesForAdmin(userId, userLevel);

      res.status(200).json({
        success: true,
        message: 'Lấy danh sách khối lớp thành công.',
        data: classes
      });
    } catch (error: any) {
      console.error('getBlockClasses controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách khối lớp.',
        error: error.message
      });
    }
  },

  /**
   * Chi tiết câu hỏi
   */
  getQuestionById: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Mã câu hỏi không hợp lệ.'
        });
        return;
      }

      const question = await QuestionService.getQuestionById(id);
      res.status(200).json({
        success: true,
        message: 'Lấy chi tiết câu hỏi thành công.',
        data: question
      });
    } catch (error: any) {
      console.error('getQuestionById controller error:', error);
      res.status(error.message.includes('Không tìm thấy') ? 404 : 500).json({
        success: false,
        message: error.message || 'Lỗi server khi lấy chi tiết câu hỏi.'
      });
    }
  },

  /**
   * Tạo câu hỏi mới
   */
  createQuestion: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;
      const userLevel = req.user?.level;
      
      const validationErrors = validateCreateQuestion(req.body);
      if (validationErrors) {
        res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ.',
          errors: validationErrors
        });
        return;
      }

      const newQuestion = await QuestionService.createQuestion(req.body, userLevel);

      // Ghi log hoạt động
      await createActivityLog({
        userId,
        userEmail,
        action: 'CREATE',
        description: `Tạo câu hỏi mới ID: ${newQuestion.id} - ${newQuestion.block_class} - ${newQuestion.unit}`,
        newValues: newQuestion
      });

      res.status(201).json({
        success: true,
        message: 'Tạo câu hỏi thành công.',
        data: newQuestion
      });
    } catch (error: any) {
      console.error('createQuestion controller error:', error);
      
      // Kiểm tra nếu là lỗi phân quyền (403)
      if (error.status === 403) {
        res.status(403).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo câu hỏi.',
        error: error.message
      });
    }
  },

  /**
   * Cập nhật câu hỏi
   */
  updateQuestion: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Mã câu hỏi không hợp lệ.'
        });
        return;
      }

      // Lấy thông tin cũ để validate và ghi log
      const oldQuestion = await QuestionService.getQuestionById(id);
      const currentQuestionType = req.body.question_type !== undefined ? req.body.question_type : oldQuestion.question_type;

      const validationErrors = validateUpdateQuestion(req.body, currentQuestionType);
      if (validationErrors) {
        res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ.',
          errors: validationErrors
        });
        return;
      }

      const userLevel = req.user?.level;

      const updatedQuestion = await QuestionService.updateQuestion(id, req.body, userLevel);

      // Ghi log hoạt động
      await createActivityLog({
        userId,
        userEmail,
        action: 'UPDATE',
        description: `Cập nhật câu hỏi ID: ${id}`,
        oldValues: oldQuestion,
        newValues: updatedQuestion
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật câu hỏi thành công.',
        data: updatedQuestion
      });
    } catch (error: any) {
      console.error('updateQuestion controller error:', error);

      // Kiểm tra nếu là lỗi phân quyền (403)
      if (error.status === 403) {
        res.status(403).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(error.message.includes('Không tìm thấy') ? 404 : 500).json({
        success: false,
        message: error.message || 'Lỗi server khi cập nhật câu hỏi.'
      });
    }
  },

  /**
   * Xóa câu hỏi
   */
  deleteQuestion: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Mã câu hỏi không hợp lệ.'
        });
        return;
      }

      // Lấy thông tin cũ để ghi log
      const oldQuestion = await QuestionService.getQuestionById(id);

      await QuestionService.deleteQuestion(id);

      // Ghi log hoạt động
      await createActivityLog({
        userId,
        userEmail,
        action: 'DELETE',
        description: `Xóa câu hỏi ID: ${id}`,
        oldValues: oldQuestion
      });

      res.status(200).json({
        success: true,
        message: 'Xóa câu hỏi thành công.'
      });
    } catch (error: any) {
      console.error('deleteQuestion controller error:', error);
      res.status(error.message.includes('Không tìm thấy') ? 404 : 500).json({
        success: false,
        message: error.message || 'Lỗi server khi xóa câu hỏi.'
      });
    }
  },

  /**
   * Xóa hàng loạt câu hỏi
   */
  bulkDeleteQuestions: async (req: Request, res: Response): Promise<void> => {
    try {
      const { questionIds } = req.body;
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Danh sách ID câu hỏi không được trống.'
        });
        return;
      }

      // Xóa hàng loạt thông qua service
      const affectedRows = await QuestionService.bulkDeleteQuestions(questionIds);

      // Ghi log hoạt động
      await createActivityLog({
        userId,
        userEmail,
        action: 'DELETE',
        description: `Xóa hàng loạt câu hỏi. ID đã chọn: ${questionIds.join(', ')}. Thực tế đã xóa vĩnh viễn: ${affectedRows} câu hỏi.`
      });

      res.status(200).json({
        success: true,
        message: `Xóa vĩnh viễn ${affectedRows} câu hỏi thành công.`,
        data: {
          affectedRows
        }
      });
    } catch (error: any) {
      console.error('bulkDeleteQuestions controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa hàng loạt câu hỏi.',
        error: error.message
      });
    }
  },

  /**
   * Tải file phương tiện lên (audio hoặc ảnh) cho câu hỏi
   */
  uploadMedia: async (req: Request, res: Response): Promise<void> => {
    try {
      const file = (req as any).file;
      console.log('>>> QuestionController.uploadMedia file:', file ? {
        fieldname: file.fieldname,
        originalname: file.originalname,
        path: file.path,
        cloudinaryUrl: (file as any).cloudinaryUrl
      } : 'No file received');

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng chọn file phương tiện để tải lên.'
        });
        return;
      }

      // Cloudinary saves path/url under file.path or file.cloudinaryUrl
      const fileUrl = file.path || (file as any).cloudinaryUrl;

      res.status(200).json({
        success: true,
        message: 'Tải file phương tiện thành công.',
        url: fileUrl
      });
    } catch (error: any) {
      console.error('uploadMedia controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi upload file phương tiện.',
        error: error.message
      });
    }
  }

};
