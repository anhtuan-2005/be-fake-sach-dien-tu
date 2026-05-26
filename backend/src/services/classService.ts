import ClassroomModel from '../models/classModel';
import { Classroom } from '../types';

const classService = {
  /**
   * Tìm kiếm lớp học với phân trang
   */
  getClasses: async (filters: any, page: number, limit: number) => {
    return await ClassroomModel.search(filters, page, limit);
  },

  /**
   * Tạo lớp học
   */
  createClass: async (classData: Partial<Classroom>) => {
    return await ClassroomModel.create(classData);
  },

  /**
   * Cập nhật lớp học
   */
  updateClass: async (id: number, classData: Partial<Classroom>) => {
    return await ClassroomModel.update(id, classData);
  },

  /**
   * Xóa lớp học
   */
  deleteClass: async (id: number) => {
    return await ClassroomModel.delete(id);
  },

  /**
   * Lấy chi tiết lớp học
   */
  getClassById: async (id: number) => {
    return await ClassroomModel.getById(id);
  },

  /**
   * Thao tác hàng loạt
   */
  bulkAction: async (ids: number[], action: string, status?: any) => {
    if (action === 'delete') {
      return await ClassroomModel.bulkDelete(ids);
    } else if (action === 'status') {
      return await ClassroomModel.bulkUpdateStatus(ids, status);
    }
    throw new Error('Hành động không hợp lệ');
  },

  /**
   * Lấy danh sách học sinh của lớp với phân trang
   */
  getClassStudents: async (classId: number, page: number = 1, limit: number = 10, keyword: string = '') => {
    return await ClassroomModel.getStudents(classId, page, limit, keyword);
  },

  /**
   * Thêm học sinh vào lớp
   */
  addStudent: async (classId: number, studentId: number) => {
    return await ClassroomModel.addStudent(classId, studentId);
  },

  /**
   * Xóa một học sinh khỏi lớp
   */
  removeStudent: async (classId: number, studentId: number) => {
    return await ClassroomModel.removeStudent(classId, studentId);
  },

  /**
   * Xóa nhiều học sinh khỏi lớp
   */
  removeStudentsBulk: async (classId: number, studentIds: number[]) => {
    return await ClassroomModel.removeStudentsBulk(classId, studentIds);
  },

  /**
   * Phê duyệt học sinh vào lớp
   */
  approveStudents: async (classId: number, studentIds: number[]) => {
    return await ClassroomModel.approveStudents(classId, studentIds);
  },

  /**
   * Lấy danh sách lớp học mà học sinh tham gia
   */
  getJoinedClasses: async (studentId: number) => {
    return await ClassroomModel.getJoinedClasses(studentId);
  },

  /**
   * Tham gia lớp học bằng mã code
   */
  joinClass: async (studentId: number, classCode: string) => {
    return await ClassroomModel.joinClassByCode(studentId, classCode);
  },

  /**
   * Lấy học sinh có sẵn để thêm vào lớp
   */
  getAvailableStudents: async (classId: number, keyword?: string) => {
    return await ClassroomModel.getAvailableStudents(classId, keyword);
  }
};

export default classService;
