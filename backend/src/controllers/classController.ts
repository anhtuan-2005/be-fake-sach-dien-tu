import { Request, Response } from 'express';
import classService from '../services/classService';
import { ApiResponse, Classroom } from '../types';
import { createActivityLog } from '../utils/logger';

const classController = {
  /**
   * Lấy danh sách lớp học với phân trang và lọc
   */
  getClasses: async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, searchType, keyword, page, limit } = req.query;

      const filters: any = {
        status: status as string,
        searchType: searchType as string,
        keyword: keyword as string
      };

      // Phân quyền cho Giáo viên: Nếu là giáo viên, chỉ lấy các lớp do chính họ phụ trách
      if (req.user && req.user.role.toLowerCase() === 'teacher') {
        filters.teacher_id = req.user.id;
      }

      const currentPage = parseInt(page as string) || 1;
      const pageSize = parseInt(limit as string) || 10;

      const { classes, total } = await classService.getClasses(filters, currentPage, pageSize);

      const response: ApiResponse<Classroom[]> = {
        success: true,
        data: classes,
        pagination: {
          currentPage,
          totalPages: Math.ceil(total / pageSize),
          totalItems: total,
          itemsPerPage: pageSize
        }
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error('>>> classController.getClasses Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách lớp học',
        error: error.message
      });
    }
  },

  /**
   * Tạo lớp học mới
   */
  createClass: async (req: Request, res: Response): Promise<void> => {
    try {
      const classData = req.body;
      
      // Tự động gán giáo viên nếu là tài khoản role teacher
      if (req.user && req.user.role.toLowerCase() === 'teacher') {
        classData.teacher_id = req.user.id;
      }

      // Tự động sinh mã lớp nếu chưa có
      if (!classData.class_code) {
        classData.class_code = 'LH_' + Math.random().toString(36).substring(2, 8).toUpperCase();
      }

      const insertId = await classService.createClass(classData);

      await createActivityLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'CREATE',
        description: `Tạo lớp học mới: ${classData.class_name} (${classData.class_code})`,
        newValues: classData,
        ipAddress: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'Tạo lớp học thành công',
        data: { id: insertId }
      });
    } catch (error: any) {
      console.error('>>> classController.createClass Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo lớp học',
        error: error.message
      });
    }
  },

  /**
   * Cập nhật lớp học
   */
  updateClass: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const classData = req.body;
      const classId = parseInt(id as string);

      const oldClass = await classService.getClassById(classId);
      if (!oldClass) {
        res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
        return;
      }

      await classService.updateClass(classId, classData);

      await createActivityLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'UPDATE',
        description: `Cập nhật lớp học: ${oldClass.class_name}`,
        oldValues: oldClass,
        newValues: classData,
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật lớp học thành công'
      });
    } catch (error: any) {
      console.error('>>> classController.updateClass Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật lớp học',
        error: error.message
      });
    }
  },

  /**
   * Xóa lớp học
   */
  deleteClass: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const classId = parseInt(id as string);

      const oldClass = await classService.getClassById(classId);
      if (!oldClass) {
        res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
        return;
      }

      await classService.deleteClass(classId);

      await createActivityLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'DELETE',
        description: `Xóa lớp học: ${oldClass.class_name}`,
        oldValues: oldClass,
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Xóa lớp học thành công'
      });
    } catch (error: any) {
      console.error('>>> classController.deleteClass Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa lớp học',
        error: error.message
      });
    }
  },

  /**
   * Xử lý hàng loạt (xóa hoặc đổi trạng thái)
   */
  bulkAction: async (req: Request, res: Response): Promise<void> => {
    try {
      const { ids, action, status } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ success: false, message: 'Danh sách ID không hợp lệ' });
        return;
      }

      await classService.bulkAction(ids, action, status);
      
      const message = action === 'delete' ? `Đã xóa ${ids.length} lớp học` : `Đã cập nhật trạng thái cho ${ids.length} lớp học`;

      await createActivityLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'UPDATE',
        description: message,
        newValues: { ids, action, status },
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message
      });
    } catch (error: any) {
      console.error('>>> classController.bulkAction Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi thực hiện thao tác hàng loạt',
        error: error.message
      });
    }
  },

  /**
   * Lấy chi tiết một lớp học
   */
  getClassById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const classId = parseInt(id as string);
      const classroom = await classService.getClassById(classId);

      if (!classroom) {
        res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
        return;
      }

      res.status(200).json({ success: true, data: classroom });
    } catch (error: any) {
      console.error('>>> classController.getClassById Error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết lớp học', error: error.message });
    }
  },

  /**
   * Lấy danh sách học sinh của một lớp với phân trang
   */
  getClassStudents: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { page, limit, keyword } = req.query;
      const classId = parseInt(id as string);
      const currentPage = parseInt(page as string) || 1;
      const pageSize = parseInt(limit as string) || 10;

      const { students, total } = await classService.getClassStudents(classId, currentPage, pageSize, keyword as string);
      
      res.status(200).json({ 
        success: true, 
        data: students,
        pagination: {
          currentPage,
          totalPages: Math.ceil(total / pageSize),
          totalItems: total,
          itemsPerPage: pageSize
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách học sinh', error: error.message });
    }
  },

  /**
   * Thêm học sinh vào lớp
   */
  addStudent: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { studentId } = req.body;
      const classId = parseInt(id as string);
      
      const success = await classService.addStudent(classId, studentId);
      if (success) {
        res.status(200).json({ success: true, message: 'Đã thêm học sinh vào lớp' });
      } else {
        res.status(400).json({ success: false, message: 'Học sinh đã có trong lớp hoặc lỗi' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi khi thêm học sinh', error: error.message });
    }
  },

  /**
   * Xóa một học sinh khỏi lớp
   */
  removeStudent: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, studentId } = req.params;
      const classId = parseInt(id as string);
      const sId = parseInt(studentId as string);

      await classService.removeStudent(classId, sId);
      res.status(200).json({ success: true, message: 'Đã xóa học sinh khỏi lớp' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi khi xóa học sinh', error: error.message });
    }
  },

  /**
   * Xóa nhiều học sinh khỏi lớp (Bulk delete)
   */
  removeStudentsBulk: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params; // class_id
      const { studentIds } = req.body;
      const classId = parseInt(id as string);

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400).json({ success: false, message: 'Danh sách ID học sinh không hợp lệ' });
        return;
      }

      await classService.removeStudentsBulk(classId, studentIds);
      res.status(200).json({ success: true, message: `Đã gỡ ${studentIds.length} học sinh khỏi lớp` });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi khi gỡ học sinh khỏi lớp', error: error.message });
    }
  },

  /**
   * Phê duyệt học sinh vào lớp (Bulk approve)
   */
  approveStudents: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params; // class_id
      const { studentIds } = req.body;
      const classId = parseInt(id as string);

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400).json({ success: false, message: 'Danh sách ID học sinh không hợp lệ' });
        return;
      }

      await classService.approveStudents(classId, studentIds);
      res.status(200).json({ success: true, message: `Đã phê duyệt ${studentIds.length} học sinh vào lớp` });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi khi phê duyệt học sinh', error: error.message });
    }
  },

  /**
   * API dành cho học sinh: Lấy danh sách lớp đã tham gia
   */
  getJoinedClasses: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        res.status(401).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
        return;
      }

      const classes = await classService.getJoinedClasses(studentId);
      res.status(200).json({ success: true, data: classes });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách lớp học đã tham gia', error: error.message });
    }
  },

  /**
   * API dành cho học sinh: Tham gia lớp học bằng mã code
   */
  joinClass: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.user?.id;
      const { classCode } = req.body;

      console.log(`>>> joinClass: studentId=${studentId}, classCode=${classCode}`);

      if (!studentId) {
        res.status(401).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
        return;
      }

      if (!classCode) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã lớp học' });
        return;
      }

      const result = await classService.joinClass(studentId, classCode);
      console.log('>>> joinClass result:', result);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('>>> joinClass error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi tham gia lớp học', error: error.message });
    }
  },

  /**
   * Lấy danh sách học sinh có thể thêm vào lớp
   */
  getAvailableStudents: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { keyword } = req.query;
      const classId = parseInt(id as string);

      const students = await classService.getAvailableStudents(classId, keyword as string);
      res.status(200).json({ success: true, data: students });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách học sinh có sẵn', error: error.message });
    }
  }
};

export default classController;
