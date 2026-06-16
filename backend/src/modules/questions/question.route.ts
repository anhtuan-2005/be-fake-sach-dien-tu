import { Router } from 'express';
import { QuestionController } from './question.controller';
import { verifyToken } from '../../middleware/authMiddleware';
import { authorize } from '../../middleware/authorize';
import { validateDto } from '../../middleware/validation.middleware';
import { BulkDeleteQuestionsDto } from './question.dto';
import { uploadQuestionMedia } from '../../middleware/uploadMiddleware';

const router = Router();

// Tất cả các route trong ngân hàng câu hỏi đều yêu cầu đăng nhập và có quyền 'admin' hoặc 'teacher'
router.use(verifyToken);
router.use(authorize(['admin', 'teacher']));

// Route upload phương tiện cho câu hỏi (audio / ảnh)
router.post('/upload', uploadQuestionMedia.single('file'), QuestionController.uploadMedia);

// Lấy danh sách khối lớp được phép (phải khai báo trước các route có dynamic params)
router.get('/block-classes', QuestionController.getBlockClasses);

// Lấy danh sách câu hỏi (phân trang + bộ lọc)
router.get('/', QuestionController.getQuestions);

// Xóa hàng loạt câu hỏi (phải đặt trước route có dynamic param /:id)
router.delete('/bulk-delete', validateDto(BulkDeleteQuestionsDto), QuestionController.bulkDeleteQuestions);

// Lấy chi tiết một câu hỏi
router.get('/:id', QuestionController.getQuestionById);

// Tạo câu hỏi mới
router.post('/', QuestionController.createQuestion);

// Cập nhật câu hỏi
router.put('/:id', QuestionController.updateQuestion);

// Xóa câu hỏi
router.delete('/:id', QuestionController.deleteQuestion);

export default router;
