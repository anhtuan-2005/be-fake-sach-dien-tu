import db from '../config/db';
import { Classroom } from '../types';
import { RowDataPacket } from 'mysql2';

/**
 * Model quản lý các thao tác với bảng 'classes'
 */
const ClassroomModel = {
  /**
   * Tìm kiếm và lọc lớp học với phân trang
   */
  search: async (filters: any, page: number = 1, limit: number = 10): Promise<{ classes: Classroom[], total: number }> => {
    try {
      let baseQuery = ' FROM classes WHERE 1=1';
      const queryParams: any[] = [];

      // 1. Lọc theo trạng thái
      if (filters.status && filters.status !== 'Tất cả') {
        baseQuery += ' AND status = ?';
        queryParams.push(filters.status === 'Đang dùng' ? 1 : 0);
      }

      // 2. Lọc theo mã lớp (nếu có dropdown chọn loại search)
      if (filters.searchType === 'Mã lớp' && filters.keyword) {
        baseQuery += ' AND class_code LIKE ?';
        queryParams.push(`%${filters.keyword}%`);
      } else if (filters.keyword) {
        // Mặc định search theo tên lớp nếu không chọn mã lớp hoặc search chung
        baseQuery += ' AND (class_name LIKE ? OR class_code LIKE ?)';
        queryParams.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
      }

      // Đếm tổng số bản ghi
      const countQuery = 'SELECT COUNT(*) as total' + baseQuery;
      const [countResult] = await db.query<RowDataPacket[]>(countQuery, queryParams);
      const total = countResult[0].total;

      // Lấy dữ liệu phân trang với đếm sĩ số động (chỉ đếm học sinh đã duyệt status = 1 và chưa bị xóa)
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT c.*, 
               (SELECT COUNT(*) 
                FROM student_classes sc2 
                JOIN users u2 ON sc2.student_id = u2.id 
                WHERE sc2.class_id = c.id AND sc2.status = 1 AND u2.deleted_at IS NULL) AS student_count 
        FROM classes c 
        WHERE 1=1 ${baseQuery.replace(' FROM classes WHERE 1=1', '')}
        ORDER BY c.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const dataParams = [...queryParams, limit, offset];

      const [rows] = await db.query<RowDataPacket[]>(dataQuery, dataParams);
      return {
        classes: rows as Classroom[],
        total
      };
    } catch (error: unknown) {
      console.error('>>> ClassroomModel Search Error:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết một lớp học kèm thông tin giáo viên và sĩ số
   */
  getById: async (id: number): Promise<Classroom | null> => {
    try {
      const query = `
        SELECT c.*, 
               u.full_name as teacher_name, 
               u.email as teacher_email, 
               u.phone as teacher_phone,
               (SELECT COUNT(*) 
                FROM student_classes sc2 
                JOIN users u2 ON sc2.student_id = u2.id 
                WHERE sc2.class_id = c.id AND sc2.status = 1 AND u2.deleted_at IS NULL) as student_count
        FROM classes c
        LEFT JOIN users u ON c.teacher_id = u.id
        WHERE c.id = ?
      `;
      const [rows] = await db.query<RowDataPacket[]>(query, [id]);
      return (rows[0] as Classroom) || null;
    } catch (error: unknown) {
      throw error;
    }
  },

  /**
   * Tạo lớp học mới
   */
  create: async (classData: Partial<Classroom>): Promise<number> => {
    try {
      const { class_code, class_name, description, status, teacher_id } = classData;
      const [result] = await db.query<any>(
        'INSERT INTO classes (class_code, class_name, description, status, completion_status, teacher_id, created_at) VALUES (?, ?, ?, ?, 0, ?, NOW())',
        [class_code, class_name, description || null, status !== undefined ? status : 1, teacher_id || null]
      );
      return result.insertId;
    } catch (error: unknown) {
      throw error;
    }
  },

  /**
   * Cập nhật lớp học
   */
  update: async (id: number, classData: Partial<Classroom>): Promise<boolean> => {
    try {
      const fields = [];
      const params = [];

      if (classData.class_code !== undefined) {
        fields.push('class_code = ?');
        params.push(classData.class_code);
      }
      if (classData.class_name !== undefined) {
        fields.push('class_name = ?');
        params.push(classData.class_name);
      }
      if (classData.description !== undefined) {
        fields.push('description = ?');
        params.push(classData.description);
      }
      if (classData.status !== undefined) {
        fields.push('status = ?');
        params.push(classData.status);
      }
      if (classData.completion_status !== undefined) {
        fields.push('completion_status = ?');
        params.push(classData.completion_status);
      }
      if (classData.teacher_id !== undefined) {
        fields.push('teacher_id = ?');
        params.push(classData.teacher_id);
      }

      if (fields.length === 0) return false;

      params.push(id);
      const [result] = await db.query<any>(
        `UPDATE classes SET ${fields.join(', ')} WHERE id = ?`,
        params
      );
      return result.affectedRows > 0;
    } catch (error: unknown) {
      throw error;
    }
  },

  /**
   * Xóa lớp học
   */
  delete: async (id: number): Promise<boolean> => {
    try {
      const [result] = await db.query<any>('DELETE FROM classes WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error: unknown) {
      throw error;
    }
  },

  /**
   * Xóa nhiều lớp học
   */
  bulkDelete: async (ids: number[]): Promise<number> => {
    try {
      const [result] = await db.query<any>('DELETE FROM classes WHERE id IN (?)', [ids]);
      return result.affectedRows;
    } catch (error: unknown) {
      throw error;
    }
  },

  /**
   * Thay đổi trạng thái nhiều lớp học
   */
  bulkUpdateStatus: async (ids: number[], status: any): Promise<number> => {
    try {
      // Map string status back to number if needed
      const statusValue = status === 'Đang dùng' ? 1 : status === 'Ngừng sử dụng' ? 0 : status;
      const [result] = await db.query<any>('UPDATE classes SET status = ? WHERE id IN (?)', [statusValue, ids]);
      return result.affectedRows;
    } catch (error: unknown) {
      throw error;
    }
  },

  /**
   * Lấy danh sách học sinh trong một lớp với phân trang
   */
  getStudents: async (classId: number, page: number = 1, limit: number = 10, keyword: string = ''): Promise<{ students: any[], total: number }> => {
    try {
      const offset = (page - 1) * limit;
      const queryParams: any[] = [classId];
      let whereClause = ' WHERE sc.class_id = ? AND u.deleted_at IS NULL AND u.is_deleted = 0';

      if (keyword) {
        whereClause += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.user_code LIKE ?)';
        const k = `%${keyword}%`;
        queryParams.push(k, k, k);
      }
      
      // Đếm tổng số học sinh trong lớp
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM student_classes sc
        JOIN users u ON sc.student_id = u.id
        ${whereClause}
      `;
      const [countResult] = await db.query<RowDataPacket[]>(countQuery, queryParams);
      const total = countResult[0].total;

      const query = `
        SELECT u.id, u.full_name, u.email, u.phone, u.user_code, sc.status as join_status 
        FROM users u
        JOIN student_classes sc ON u.id = sc.student_id
        ${whereClause}
        LIMIT ? OFFSET ?
      `;
      const [rows] = await db.query<RowDataPacket[]>(query, [...queryParams, limit, offset]);
      return {
        students: rows,
        total
      };
    } catch (error: unknown) {
      throw error;
    }
  },

  /**
   * Phê duyệt học sinh vào lớp (Cập nhật status = 1)
   */
  approveStudents: async (classId: number, studentIds: number[]): Promise<number> => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query<any>(
        'UPDATE student_classes SET status = 1 WHERE class_id = ? AND student_id IN (?)',
        [classId, studentIds]
      );

      if (result.affectedRows > 0) {
        await connection.query(
          'UPDATE classes SET total_students = total_students + ? WHERE id = ?',
          [result.affectedRows, classId]
        );
      }

      await connection.commit();
      return result.affectedRows;
    } catch (error: unknown) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Xóa nhiều học sinh khỏi lớp (Xóa bản ghi liên kết)
   */
  removeStudentsBulk: async (classId: number, studentIds: number[]): Promise<number> => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      // Chỉ giảm sĩ số cho những học sinh đã được duyệt (status = 1)
      const [approvedStudents]: any = await connection.query(
        'SELECT student_id FROM student_classes WHERE class_id = ? AND student_id IN (?) AND status = 1',
        [classId, studentIds]
      );

      const [result] = await connection.query<any>(
        'DELETE FROM student_classes WHERE class_id = ? AND student_id IN (?)',
        [classId, studentIds]
      );

      if (approvedStudents.length > 0) {
        await connection.query(
          'UPDATE classes SET total_students = total_students - ? WHERE id = ?',
          [approvedStudents.length, classId]
        );
      }

      await connection.commit();
      return result.affectedRows;
    } catch (error: unknown) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Thêm học sinh vào lớp
   */
  addStudent: async (classId: number, studentId: number): Promise<boolean> => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      // Kiểm tra xem đã có trong lớp chưa
      const [existing]: any = await connection.query(
        'SELECT * FROM student_classes WHERE class_id = ? AND student_id = ?',
        [classId, studentId]
      );
      if (existing.length > 0) {
        await connection.rollback();
        return false;
      }

      const [result] = await connection.query<any>(
        'INSERT INTO student_classes (class_id, student_id, status) VALUES (?, ?, 1)',
        [classId, studentId]
      );

      if (result.affectedRows > 0) {
        await connection.query(
          'UPDATE classes SET total_students = total_students + 1 WHERE id = ?',
          [classId]
        );
      }

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error: unknown) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Xóa học sinh khỏi lớp
   */
  removeStudent: async (classId: number, studentId: number): Promise<boolean> => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      // Kiểm tra xem học sinh có trong lớp và đã duyệt chưa
      const [existing]: any = await connection.query(
        'SELECT status FROM student_classes WHERE class_id = ? AND student_id = ?',
        [classId, studentId]
      );

      if (existing.length === 0) {
        await connection.rollback();
        return false;
      }

      const wasApproved = existing[0].status === 1;

      const [result] = await connection.query<any>(
        'DELETE FROM student_classes WHERE class_id = ? AND student_id = ?',
        [classId, studentId]
      );

      if (result.affectedRows > 0 && wasApproved) {
        await connection.query(
          'UPDATE classes SET total_students = total_students - 1 WHERE id = ?',
          [classId]
        );
      }

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error: unknown) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Lấy danh sách lớp học mà học sinh đã tham gia
   */
  getJoinedClasses: async (studentId: number): Promise<any[]> => {
    try {
      const query = `
        SELECT c.*, sc.status as join_status,
               (SELECT COUNT(*) 
                FROM student_classes sc2 
                JOIN users u2 ON sc2.student_id = u2.id 
                WHERE sc2.class_id = c.id AND sc2.status = 1 AND u2.deleted_at IS NULL) as student_count
        FROM classes c
        JOIN student_classes sc ON c.id = sc.class_id
        WHERE sc.student_id = ?
        ORDER BY c.created_at DESC
      `;
      const [rows] = await db.query<RowDataPacket[]>(query, [studentId]);
      return rows;
    } catch (error: unknown) {
      throw error;
    }
  },

  /**
   * Học sinh tham gia vào lớp học bằng mã lớp
   */
  joinClassByCode: async (studentId: number, classCode: string): Promise<{ success: boolean; message: string }> => {
    try {
      // 1. Kiểm tra lớp học có tồn tại không
      const [classes] = await db.query<RowDataPacket[]>(
        'SELECT id FROM classes WHERE class_code = ?',
        [classCode]
      );

      if (classes.length === 0) {
        return { success: false, message: 'Mã lớp học không tồn tại' };
      }

      const classId = classes[0].id;

      // 2. Kiểm tra đã tham gia lớp này chưa
      const [existing] = await db.query<RowDataPacket[]>(
        'SELECT * FROM student_classes WHERE class_id = ? AND student_id = ?',
        [classId, studentId]
      );

      if (existing.length > 0) {
        return { success: false, message: 'Bạn đã tham gia hoặc đang chờ duyệt vào lớp này rồi' };
      }

      // 3. Thêm vào bảng trung gian với status = 0 (Chờ duyệt)
      await db.query(
        'INSERT INTO student_classes (class_id, student_id, status) VALUES (?, ?, 0)',
        [classId, studentId]
      );

      return { success: true, message: 'Đã gửi yêu cầu tham gia lớp học thành công' };
    } catch (error: unknown) {
      throw error;
    }
  },

  /**
   * Lấy danh sách học sinh chưa có trong lớp này và chưa bị xóa mềm
   */
  getAvailableStudents: async (classId: number, keyword: string = ''): Promise<any[]> => {
    try {
      let query = `
        SELECT id, full_name, email, user_code 
        FROM users 
        WHERE account_type = 'Học sinh' 
        AND deleted_at IS NULL
        AND is_deleted = 0
        AND id NOT IN (SELECT student_id FROM student_classes WHERE class_id = ?)
      `;
      const params: any[] = [classId];

      if (keyword) {
        query += ' AND (full_name LIKE ? OR email LIKE ? OR user_code LIKE ?)';
        const k = `%${keyword}%`;
        params.push(k, k, k);
      }

      query += ' LIMIT 20';
      const [rows] = await db.query<RowDataPacket[]>(query, params);
      return rows;
    } catch (error: unknown) {
      throw error;
    }
  }
};

export default ClassroomModel;
