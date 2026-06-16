import db from '../../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { CreateQuestionDto, UpdateQuestionDto, QuestionAnswer } from './question.dto';

/**
 * Interface đại diện cho cấu trúc bảng questions trong DB
 */
export interface QuestionRow extends RowDataPacket {
  id: number;
  block_class: string;
  unit: string;
  skill: string;
  question_type: string;
  requirement: string;
  content: string;
  audio_url?: string | null;
  image_url?: string | null;
  answers: string; // Lưu trữ dưới dạng JSON string trong DB
  cognitive_level: string;
  created_at: Date;
}

/**
 * Interface đại diện cho đối tượng Question ở tầng Domain/Service
 * (answers đã được parse thành mảng object)
 */
export interface Question {
  id: number;
  block_class: string;
  unit: string;
  skill: string;
  question_type: string;
  requirement: string;
  content: string;
  audio_url?: string | null;
  image_url?: string | null;
  answers: QuestionAnswer[];
  cognitive_level: string;
  created_at: Date;
}

export class QuestionModel {
  /**
   * Helper để parse chuỗi JSON answers từ DB thành mảng object
   */
  private static formatQuestion(row: QuestionRow): Question {
    let parsedAnswers: QuestionAnswer[] = [];
    try {
      const answersVal = row.answers;
      if (typeof answersVal === 'string') {
        const trimmed = answersVal.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          parsedAnswers = JSON.parse(answersVal);
        } else {
          // Legacy plain text answer -> convert to a single correct option
          parsedAnswers = [{ text: answersVal, isCorrect: true }];
        }
      } else if (Array.isArray(answersVal)) {
        parsedAnswers = answersVal;
      } else if (answersVal) {
        parsedAnswers = [{ text: String(answersVal), isCorrect: true }];
      }
    } catch (e) {
      console.error(`Error parsing answers for question ${row.id}:`, e);
      parsedAnswers = [{ text: String(row.answers), isCorrect: true }];
    }
    
    return {
      ...row,
      answers: parsedAnswers
    };
  }

  /**
   * Tạo câu hỏi mới
   */
  static async create(data: CreateQuestionDto): Promise<number> {
    const query = `
      INSERT INTO questions (block_class, unit, skill, question_type, requirement, content, audio_url, image_url, answers, cognitive_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      data.block_class,
      data.unit,
      data.skill,
      data.question_type,
      data.requirement,
      data.content,
      data.audio_url || null,
      data.image_url || null,
      JSON.stringify(data.answers), // Chuyển mảng answers thành JSON string trước khi lưu
      data.cognitive_level
    ];

    const [result] = await db.query<ResultSetHeader>(query, values);
    return result.insertId;
  }

  /**
   * Cập nhật thông tin câu hỏi
   */
  static async update(id: number, data: UpdateQuestionDto): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.block_class !== undefined) {
      fields.push('block_class = ?');
      values.push(data.block_class);
    }
    if (data.unit !== undefined) {
      fields.push('unit = ?');
      values.push(data.unit);
    }
    if (data.skill !== undefined) {
      fields.push('skill = ?');
      values.push(data.skill);
    }
    if (data.question_type !== undefined) {
      fields.push('question_type = ?');
      values.push(data.question_type);
    }
    if (data.requirement !== undefined) {
      fields.push('requirement = ?');
      values.push(data.requirement);
    }
    if (data.content !== undefined) {
      fields.push('content = ?');
      values.push(data.content);
    }
    if (data.audio_url !== undefined) {
      fields.push('audio_url = ?');
      values.push(data.audio_url);
    }
    if (data.image_url !== undefined) {
      fields.push('image_url = ?');
      values.push(data.image_url);
    }
    if (data.answers !== undefined) {
      fields.push('answers = ?');
      values.push(JSON.stringify(data.answers)); // Chuyển mảng answers thành JSON string trước khi cập nhật
    }
    if (data.cognitive_level !== undefined) {
      fields.push('cognitive_level = ?');
      values.push(data.cognitive_level);
    }

    if (fields.length === 0) return true;

    values.push(id);
    const query = `UPDATE questions SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query<ResultSetHeader>(query, values);
    return result.affectedRows > 0;
  }

  /**
   * Xóa câu hỏi theo ID
   */
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM questions WHERE id = ?';
    const [result] = await db.query<ResultSetHeader>(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Xóa hàng loạt câu hỏi theo danh sách ID
   */
  static async bulkDelete(questionIds: number[]): Promise<number> {
    if (!questionIds || questionIds.length === 0) return 0;
    const placeholders = questionIds.map(() => '?').join(', ');
    const query = `DELETE FROM questions WHERE id IN (${placeholders})`;
    const [result] = await db.query<ResultSetHeader>(query, questionIds);
    return result.affectedRows;
  }


  /**
   * Lấy câu hỏi theo ID
   */
  static async findById(id: number): Promise<Question | null> {
    const query = 'SELECT * FROM questions WHERE id = ?';
    const [rows] = await db.query<QuestionRow[]>(query, [id]);
    if (!rows[0]) return null;
    return this.formatQuestion(rows[0]);
  }

  /**
   * Hỗ trợ xây dựng điều kiện WHERE và mảng tham số động cho bộ lọc
   */
  private static buildFilterQuery(filters: {
    block_class?: string;
    unit?: string;
    skill?: string;
    question_type?: string;
    cognitive_level?: string;
    keyword?: string;
    id?: string;
    allowed_classes?: string[];
  }): { whereClause: string; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters.id) {
      conditions.push('id = ?');
      values.push(parseInt(filters.id, 10) || 0);
    }

    if (filters.block_class) {
      conditions.push('block_class = ?');
      values.push(filters.block_class);
    } else if (filters.allowed_classes && filters.allowed_classes.length > 0) {
      // Lọc các khối lớp nằm trong danh sách được phép
      const placeholders = filters.allowed_classes.map(() => '?').join(', ');
      conditions.push(`block_class IN (${placeholders})`);
      values.push(...filters.allowed_classes);
    }

    if (filters.unit) {
      conditions.push('unit = ?');
      values.push(filters.unit);
    }

    if (filters.skill) {
      conditions.push('skill = ?');
      values.push(filters.skill);
    }

    if (filters.question_type) {
      conditions.push('question_type = ?');
      values.push(filters.question_type);
    }

    if (filters.cognitive_level) {
      conditions.push('cognitive_level = ?');
      values.push(filters.cognitive_level);
    }

    if (filters.keyword) {
      conditions.push('(content LIKE ? OR requirement LIKE ?)');
      const searchPattern = `%${filters.keyword}%`;
      values.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, values };
  }

  /**
   * Lấy danh sách câu hỏi phân trang kèm bộ lọc
   */
  static async findAll(
    filters: {
      block_class?: string;
      unit?: string;
      skill?: string;
      question_type?: string;
      cognitive_level?: string;
      keyword?: string;
      id?: string;
      allowed_classes?: string[];
    },
    limit: number,
    offset: number
  ): Promise<Question[]> {
    const { whereClause, values } = this.buildFilterQuery(filters);
    
    // Thêm LIMIT và OFFSET
    const query = `
      SELECT * FROM questions
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;
    
    // Đảm bảo kiểu số cho LIMIT và OFFSET
    const queryValues = [...values, limit, offset];
    const [rows] = await db.query<QuestionRow[]>(query, queryValues);
    return rows.map(row => this.formatQuestion(row));
  }

  /**
   * Đếm tổng số câu hỏi thỏa mãn bộ lọc để tính phân trang
   */
  static async countAll(filters: {
    block_class?: string;
    unit?: string;
    skill?: string;
    question_type?: string;
    cognitive_level?: string;
    keyword?: string;
    id?: string;
    allowed_classes?: string[];
  }): Promise<number> {
    const { whereClause, values } = this.buildFilterQuery(filters);
    const query = `SELECT COUNT(*) as total FROM questions ${whereClause}`;
    const [rows]: any = await db.query(query, values);
    return rows[0]?.total || 0;
  }
}
