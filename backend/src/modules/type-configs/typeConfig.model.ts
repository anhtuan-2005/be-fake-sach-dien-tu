import db from '../../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { CreateTypeConfigDto, UpdateTypeConfigDto } from './typeConfig.dto';

/**
 * Interface đại diện cho thực thể TypeConfig trong Database
 */
export interface TypeConfig {
  id: number;
  type: string;
  option_type: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface TypeConfigRow extends TypeConfig, RowDataPacket {}

export class TypeConfigModel {
  /**
   * Lấy danh sách tất cả các cấu hình thể loại
   */
  static async findAll(): Promise<TypeConfig[]> {
    const query = 'SELECT * FROM type_configs ORDER BY id DESC';
    const [rows] = await db.query<TypeConfigRow[]>(query);
    return rows;
  }

  /**
   * Tìm cấu hình thể loại dựa trên ID
   */
  static async findById(id: number): Promise<TypeConfig | null> {
    const query = 'SELECT * FROM type_configs WHERE id = ?';
    const [rows] = await db.query<TypeConfigRow[]>(query, [id]);
    if (!rows[0]) return null;
    return rows[0];
  }

  /**
   * Tạo mới một cấu hình thể loại
   */
  static async create(data: CreateTypeConfigDto): Promise<number> {
    const query = 'INSERT INTO type_configs (type, option_type, status) VALUES (?, ?, ?)';
    const values = [data.type, data.option_type, 'active'];
    const [result] = await db.query<ResultSetHeader>(query, values);
    return result.insertId;
  }

  /**
   * Cập nhật cấu hình thể loại theo ID
   */
  static async update(id: number, data: UpdateTypeConfigDto): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.type !== undefined) {
      fields.push('type = ?');
      values.push(data.type);
    }
    if (data.option_type !== undefined) {
      fields.push('option_type = ?');
      values.push(data.option_type);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) return true;

    values.push(id);
    const query = `UPDATE type_configs SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query<ResultSetHeader>(query, values);
    return result.affectedRows > 0;
  }
}
