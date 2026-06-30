import db from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Assignment {
  id: number;
  class_id: number;
  title: string;
  exercise_type_id: number | null;
  exercise_type_name?: string | null;
  max_score: number;
  color: string;
  requirements: string | null;
  created_at: Date;
  updated_at: Date;
  assigned_count?: number;
  submitted_count?: number;
}

export interface AssignmentStudent {
  student_id: number;
  full_name: string;
  email: string;
  user_code: string;
  status: number;
  score: number | null;
  feedback: string | null;
  submitted_at: Date | null;
  graded_at: Date | null;
}

export interface AssignmentQuestion {
  question_id: number;
  block_class: string;
  unit: string;
  skill: string;
  question_type: string;
  requirement: string;
  content: string;
  cognitive_level: string;
  answers?: string;
}

const AssignmentModel = {
  /**
   * Tạo bài tập mới kèm danh sách học sinh giao bài và câu hỏi được gán
   */
  create: async (
    classId: number,
    data: {
      title: string;
      exercise_type_id?: number | null;
      max_score?: number;
      color?: string;
      requirements?: string | null;
      duration?: string;
      due_date?: Date | null;
    },
    studentIds: number[],
    questionIds: number[]
  ): Promise<number> => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Thêm bản ghi bài tập
      const now = new Date();
      const insertAssignmentQuery = `
        INSERT INTO assignments (class_id, title, exercise_type_id, max_score, color, requirements, duration, due_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [assignmentResult] = await connection.query<ResultSetHeader>(insertAssignmentQuery, [
        classId,
        data.title,
        data.exercise_type_id || null,
        data.max_score !== undefined ? data.max_score : 10,
        data.color || '#3b82f6',
        data.requirements || null,
        data.duration || '7d',
        data.due_date || null,
        now,
        now
      ]);

      const assignmentId = assignmentResult.insertId;

      // 2. Thêm danh sách học sinh được giao bài
      if (studentIds && studentIds.length > 0) {
        const insertStudentsQuery = `
          INSERT INTO assignment_students (assignment_id, student_id, status)
          VALUES ?
        `;
        const studentValues = studentIds.map(studentId => [assignmentId, studentId, 0]);
        await connection.query(insertStudentsQuery, [studentValues]);
      }

      // 3. Thêm danh sách câu hỏi gán cho bài tập
      if (questionIds && questionIds.length > 0) {
        const insertQuestionsQuery = `
          INSERT INTO assignment_questions (assignment_id, question_id, order_index)
          VALUES ?
        `;
        const questionValues = questionIds.map((questionId, index) => [assignmentId, questionId, index]);
        await connection.query(insertQuestionsQuery, [questionValues]);
      }

      await connection.commit();
      return assignmentId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Cập nhật bài tập (Chỉnh sửa / Gia hạn thời gian)
   */
  update: async (
    id: number,
    data: {
      title: string;
      exercise_type_id?: number | null;
      max_score?: number;
      color?: string;
      requirements?: string | null;
      duration?: string;
      due_date?: Date | null;
    },
    studentIds: number[],
    questionIds: number[]
  ): Promise<boolean> => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Cập nhật bảng assignments
      const updateQuery = `
        UPDATE assignments 
        SET title = ?, exercise_type_id = ?, max_score = ?, color = ?, requirements = ?, duration = ?, due_date = ?, updated_at = ?
        WHERE id = ?
      `;
      await connection.query(updateQuery, [
        data.title,
        data.exercise_type_id || null,
        data.max_score !== undefined ? data.max_score : 10,
        data.color || '#3b82f6',
        data.requirements || null,
        data.duration || '7d',
        data.due_date || null,
        new Date(),
        id
      ]);

      // 2. Cập nhật học sinh (Bảo toàn kết quả của những học sinh đã làm bài)
      // Lấy danh sách học sinh hiện tại và trạng thái của chúng
      const [existingStudents] = await connection.query<RowDataPacket[]>(
        'SELECT student_id, status FROM assignment_students WHERE assignment_id = ?',
        [id]
      );

      const existingStudentIds = existingStudents.map(r => r.student_id);

      // Các học sinh cần xóa: Có trong CSDL hiện tại nhưng KHÔNG có trong danh sách mới gửi lên, và CHƯA làm bài (status = 0)
      const studentsToDelete = existingStudents
        .filter(r => r.status === 0 && !studentIds.includes(r.student_id))
        .map(r => r.student_id);

      if (studentsToDelete.length > 0) {
        await connection.query(
          'DELETE FROM assignment_students WHERE assignment_id = ? AND student_id IN (?)',
          [id, studentsToDelete]
        );
      }

      // Các học sinh cần thêm mới: Có trong danh sách mới gửi lên nhưng KHÔNG có trong CSDL hiện tại
      const studentsToAdd = studentIds.filter(studentId => !existingStudentIds.includes(studentId));

      if (studentsToAdd.length > 0) {
        const insertStudentsQuery = `
          INSERT INTO assignment_students (assignment_id, student_id, status)
          VALUES ?
        `;
        const studentValues = studentsToAdd.map(studentId => [id, studentId, 0]);
        await connection.query(insertStudentsQuery, [studentValues]);
      }

      // 3. Cập nhật câu hỏi (xóa hết câu hỏi cũ đi rồi insert lại)
      await connection.query('DELETE FROM assignment_questions WHERE assignment_id = ?', [id]);
      if (questionIds && questionIds.length > 0) {
        const insertQuestionsQuery = `
          INSERT INTO assignment_questions (assignment_id, question_id, order_index)
          VALUES ?
        `;
        const questionValues = questionIds.map((questionId, index) => [id, questionId, index]);
        await connection.query(insertQuestionsQuery, [questionValues]);
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Lấy danh sách bài tập của một lớp
   */
  getByClassId: async (classId: number): Promise<Assignment[]> => {
    try {
      const query = `
        SELECT a.*, 
               et.vietnamese_title as exercise_type_name,
               (SELECT COUNT(*) FROM assignment_students WHERE assignment_id = a.id) as assigned_count,
               (SELECT COUNT(*) FROM assignment_students WHERE assignment_id = a.id AND status >= 1) as submitted_count
        FROM assignments a
        LEFT JOIN exercise_types et ON a.exercise_type_id = et.id
        WHERE a.class_id = ?
        ORDER BY a.created_at DESC
      `;
      const [rows] = await db.query<RowDataPacket[]>(query, [classId]);
      return rows as Assignment[];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy chi tiết một bài tập
   */
  getById: async (id: number): Promise<Assignment | null> => {
    try {
      const query = `
        SELECT a.*, et.vietnamese_title as exercise_type_name
        FROM assignments a
        LEFT JOIN exercise_types et ON a.exercise_type_id = et.id
        WHERE a.id = ?
      `;
      const [rows] = await db.query<RowDataPacket[]>(query, [id]);
      return (rows[0] as Assignment) || null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy danh sách học sinh được giao bài của một bài tập kèm trạng thái nộp bài
   */
  getAssignedStudents: async (assignmentId: number): Promise<AssignmentStudent[]> => {
    try {
      const query = `
        SELECT u.id as student_id, u.full_name, u.email, u.user_code, 
               ast.status, ast.score, ast.feedback, ast.submitted_at, ast.graded_at
        FROM assignment_students ast
        JOIN users u ON ast.student_id = u.id
        WHERE ast.assignment_id = ?
        ORDER BY u.full_name ASC
      `;
      const [rows] = await db.query<RowDataPacket[]>(query, [assignmentId]);
      return rows as AssignmentStudent[];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy danh sách câu hỏi thuộc bài tập
   */
  getQuestions: async (assignmentId: number): Promise<AssignmentQuestion[]> => {
    try {
      const query = `
        SELECT q.id as question_id, q.block_class, q.unit, q.skill, q.question_type, 
               q.requirement, q.content, q.answers, q.cognitive_level
        FROM assignment_questions aq
        JOIN questions q ON aq.question_id = q.id
        WHERE aq.assignment_id = ?
        ORDER BY aq.order_index ASC
      `;
      const [rows] = await db.query<RowDataPacket[]>(query, [assignmentId]);
      return rows as AssignmentQuestion[];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Xóa bài tập
   */
  delete: async (id: number): Promise<boolean> => {
    try {
      const query = 'DELETE FROM assignments WHERE id = ?';
      const [result] = await db.query<ResultSetHeader>(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy danh sách bài tập được giao cho học sinh trong một lớp
   */
  getStudentAssignments: async (classId: number, studentId: number): Promise<any[]> => {
    try {
      const query = `
        SELECT a.*, 
               et.vietnamese_title as exercise_type_name,
               ast.status, ast.score, ast.feedback, ast.submitted_at, ast.graded_at, ast.answers as student_answers
        FROM assignments a
        JOIN assignment_students ast ON a.id = ast.assignment_id
        LEFT JOIN exercise_types et ON a.exercise_type_id = et.id
        WHERE a.class_id = ? AND ast.student_id = ?
        ORDER BY a.created_at DESC
      `;
      const [rows] = await db.query<RowDataPacket[]>(query, [classId, studentId]);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Lấy danh sách câu hỏi kèm đáp án của bài tập (để chấm điểm và nộp bài)
   */
  getQuestionsWithAnswers: async (assignmentId: number): Promise<any[]> => {
    try {
      const query = `
        SELECT q.id as question_id, q.block_class, q.unit, q.skill, q.question_type, 
               q.requirement, q.content, q.answers, q.cognitive_level
        FROM assignment_questions aq
        JOIN questions q ON aq.question_id = q.id
        WHERE aq.assignment_id = ?
        ORDER BY aq.order_index ASC
      `;
      const [rows] = await db.query<RowDataPacket[]>(query, [assignmentId]);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cập nhật kết quả làm bài tập của học sinh
   */
  submitAssignment: async (
    assignmentId: number,
    studentId: number,
    score: number,
    answersJson: string
  ): Promise<boolean> => {
    try {
      const query = `
        UPDATE assignment_students 
        SET status = 1, score = ?, answers = ?, submitted_at = ?
        WHERE assignment_id = ? AND student_id = ?
      `;
      const [result] = await db.query<ResultSetHeader>(query, [score, answersJson, new Date(), assignmentId, studentId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
};

export default AssignmentModel;
