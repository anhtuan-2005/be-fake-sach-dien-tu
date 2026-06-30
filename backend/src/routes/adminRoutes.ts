import express, { Router } from 'express';
import userController from '../controllers/userController';
import activityLogController from '../controllers/activityLogController';
import classController from '../controllers/classController';
import assignmentController from '../controllers/assignmentController';
import { verifyToken, checkRole } from '../middleware/authMiddleware';

const router: Router = express.Router();

// Áp dụng verifyToken cho tất cả các route trong file này
router.use(verifyToken);

// Lấy danh sách tất cả người dùng (Chỉ admin)
router.get('/users', checkRole(['admin']), userController.getUsers);

// Lấy lịch sử thao tác
router.get('/activity-logs', checkRole(['admin']), activityLogController.getLogs);

// Tạo người dùng mới
router.post('/users', checkRole(['admin']), userController.createUser);

// Cập nhật người dùng
router.put('/users/:id', checkRole(['admin']), userController.updateUser);

// Xóa mềm người dùng (Chuyển vào thùng rác)
router.delete('/users/:id', checkRole(['admin']), userController.softDeleteUser);

// Khôi phục người dùng (Chuyển sang PUT theo yêu cầu)
router.put('/users/:id/restore', checkRole(['admin']), userController.restoreUser);

// Xóa vĩnh viễn người dùng
router.delete('/users/:id/hard-delete', checkRole(['admin']), userController.hardDeleteUser);

// --- QUẢN LÝ LỚP HỌC ---
// Lấy danh sách lớp học
router.get('/classes', checkRole(['admin', 'teacher', 'student']), classController.getClasses);

// Lấy chi tiết một lớp học
router.get('/classes/:id', checkRole(['admin', 'teacher', 'student']), classController.getClassById);

// Tạo lớp học mới
router.post('/classes', checkRole(['admin', 'teacher']), classController.createClass);

// Cập nhật lớp học
router.put('/classes/:id', checkRole(['admin', 'teacher']), classController.updateClass);

// Xóa lớp học
router.delete('/classes/:id', checkRole(['admin', 'teacher']), classController.deleteClass);

// Thao tác hàng loạt (Xóa/Đổi trạng thái)
router.post('/classes/bulk-action', checkRole(['admin', 'teacher']), classController.bulkAction);

// --- QUẢN LÝ HỌC SINH TRONG LỚP ---
// Lấy danh sách học sinh của lớp
router.get('/classes/:id/students', checkRole(['admin', 'teacher', 'student']), classController.getClassStudents);

// Lấy danh sách học sinh có sẵn để thêm vào lớp
router.get('/classes/:id/available-students', checkRole(['admin', 'teacher']), classController.getAvailableStudents);

// Thêm học sinh vào lớp
router.post('/classes/:id/students', checkRole(['admin', 'teacher']), classController.addStudent);

// Xóa học sinh khỏi lớp (Đơn lẻ)
router.delete('/classes/:id/students/:studentId', checkRole(['admin', 'teacher']), classController.removeStudent);

// Xóa học sinh khỏi lớp (Hàng loạt)
router.delete('/classes/:id/students', checkRole(['admin', 'teacher']), classController.removeStudentsBulk);

// Phê duyệt học sinh vào lớp (Hàng loạt)
router.put('/classes/:id/students/approve', checkRole(['admin', 'teacher']), classController.approveStudents);

// --- QUẢN LÝ BÀI TẬP TRONG LỚP ---
// Lấy danh sách bài tập của lớp
router.get('/classes/:classId/assignments', checkRole(['admin', 'teacher', 'student']), assignmentController.getAssignments);

// Tạo bài tập mới
router.post('/classes/:classId/assignments', checkRole(['admin', 'teacher']), assignmentController.createAssignment);

// Chi tiết bài tập
router.get('/assignments/:id', checkRole(['admin', 'teacher', 'student']), assignmentController.getAssignmentById);

// Xóa bài tập
router.delete('/assignments/:id', checkRole(['admin', 'teacher']), assignmentController.deleteAssignment);

// Cập nhật/Gia hạn bài tập
router.put('/assignments/:id', checkRole(['admin', 'teacher']), assignmentController.updateAssignment);

// Học sinh lấy danh sách bài tập được giao
router.get('/student/classes/:classId/assignments', checkRole(['admin', 'teacher', 'student']), assignmentController.getStudentAssignments);

// Học sinh nộp bài tập trắc nghiệm
router.post('/student/assignments/:assignmentId/submit', checkRole(['student']), assignmentController.submitAssignment);

// --- API DÀNH CHO HỌC SINH (TRONG VIEW ADMIN) ---
// Lấy danh sách lớp đã tham gia
router.get('/student-classes', checkRole(['admin', 'teacher', 'student']), classController.getJoinedClasses);

// Tham gia lớp học bằng mã code
router.post('/student-classes/join', checkRole(['admin', 'teacher', 'student']), classController.joinClass);

export default router;
