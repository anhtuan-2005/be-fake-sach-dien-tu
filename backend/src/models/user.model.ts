import db from '../config/db';
import { User as UserInterface } from '../types';
import { RowDataPacket } from 'mysql2';

/**
 * Model quản lý các thao tác với người dùng (Profile-focused)
 * Tuân thủ yêu cầu đặt tên src/models/user.model.ts
 */
export class UserModel {
  /**
   * Tìm người dùng theo ID
   */
  static async findUserById(id: number): Promise<UserInterface | null> {
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [id]);
    return (rows[0] as UserInterface) || null;
  }

  /**
   * Cập nhật thông tin profile
   */
  static async updateUserProfile(id: number, data: Partial<UserInterface>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(data.full_name);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.level !== undefined) {
      fields.push('level = ?');
      values.push(data.level);
    }
    if (data.avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      values.push(data.avatar_url);
    }

    if (fields.length === 0) return true;

    values.push(id);
    const [result] = await db.query<any>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  /**
   * Cập nhật mật khẩu mới (đã hash)
   */
  static async updateUserPassword(id: number, hashedNewPassword: string): Promise<boolean> {
    const [result] = await db.query<any>(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, id]
    );
    return result.affectedRows > 0;
  }
}
