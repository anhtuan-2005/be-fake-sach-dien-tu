import db from '../../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { CreateExerciseTypeDto, UpdateExerciseTypeDto } from './exercise-type.dto';

/**
 * Interface đại diện cho thực thể ExerciseType trong Database
 */
export interface ExerciseType {
  id: number;
  school_level: 'Tieu hoc' | 'THCS' | 'THPT';
  parent_id: number | null;
  name: string;
  vietnamese_title: string | null;
  code: string;
  answer_type_code: 'single' | 'multiple' | null;
  skill: string | null;
}

/**
 * Interface đại diện cho cấu trúc cây trả về Client
 */
export interface ExerciseTypeTree extends ExerciseType {
  children?: ExerciseTypeTree[];
}

export interface ExerciseTypeRow extends ExerciseType, RowDataPacket {}

export class ExerciseTypeModel {
  /**
   * Lấy toàn bộ danh sách các loại bài tập từ Database
   */
  static async findAll(): Promise<ExerciseType[]> {
    const query = 'SELECT * FROM exercise_types ORDER BY id ASC';
    const [rows] = await db.query<ExerciseTypeRow[]>(query);
    return rows;
  }

  /**
   * Tìm một loại bài tập bằng ID
   */
  static async findById(id: number): Promise<ExerciseType | null> {
    const query = 'SELECT * FROM exercise_types WHERE id = ?';
    const [rows] = await db.query<ExerciseTypeRow[]>(query, [id]);
    if (!rows[0]) return null;
    return rows[0];
  }

  /**
   * Đếm số lượng loại bài tập con trực thuộc loại bài tập cha này
   */
  static async hasChildren(id: number): Promise<boolean> {
    const query = 'SELECT COUNT(*) as count FROM exercise_types WHERE parent_id = ?';
    const [rows]: any = await db.query(query, [id]);
    return rows[0]?.count > 0;
  }

  /**
   * Tìm loại bài tập dựa trên code (để kiểm tra tính duy nhất)
   */
  static async findByCode(code: string, excludeId?: number): Promise<ExerciseType | null> {
    let query = 'SELECT * FROM exercise_types WHERE code = ?';
    const params: any[] = [code];
    if (excludeId !== undefined) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const [rows] = await db.query<ExerciseTypeRow[]>(query, params);
    if (!rows[0]) return null;
    return rows[0];
  }

  /**
   * Tạo mới một bản ghi loại bài tập
   */
  static async create(data: CreateExerciseTypeDto): Promise<number> {
    const query = `
      INSERT INTO exercise_types (school_level, parent_id, name, vietnamese_title, code, answer_type_code, skill)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      data.school_level,
      data.parent_id !== undefined ? data.parent_id : null,
      data.name,
      data.vietnamese_title !== undefined ? data.vietnamese_title : null,
      data.code,
      data.answer_type_code !== undefined ? data.answer_type_code : null,
      data.skill !== undefined ? data.skill : null
    ];
    const [result] = await db.query<ResultSetHeader>(query, values);
    return result.insertId;
  }

  /**
   * Cập nhật thông tin loại bài tập theo ID
   */
  static async update(id: number, data: UpdateExerciseTypeDto): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.school_level !== undefined) {
      fields.push('school_level = ?');
      values.push(data.school_level);
    }
    
    // Xử lý cập nhật parent_id
    if (data.parent_id !== undefined) {
      fields.push('parent_id = ?');
      values.push(data.parent_id);
    }

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }

    if (data.vietnamese_title !== undefined) {
      fields.push('vietnamese_title = ?');
      values.push(data.vietnamese_title);
    }

    if (data.code !== undefined) {
      fields.push('code = ?');
      values.push(data.code);
    }

    // Xử lý cập nhật answer_type_code và skill (cho phép gán null)
    if (data.answer_type_code !== undefined) {
      fields.push('answer_type_code = ?');
      values.push(data.answer_type_code);
    }

    if (data.skill !== undefined) {
      fields.push('skill = ?');
      values.push(data.skill);
    }

    if (fields.length === 0) return true;

    values.push(id);
    const query = `UPDATE exercise_types SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query<ResultSetHeader>(query, values);
    return result.affectedRows > 0;
  }

  /**
   * Xóa một bản ghi loại bài tập khỏi Database
   */
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM exercise_types WHERE id = ?';
    const [result] = await db.query<ResultSetHeader>(query, [id]);
    return result.affectedRows > 0;
  }
}
