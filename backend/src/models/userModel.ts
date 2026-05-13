import db from '../config/db';
import { User as UserInterface } from '../types';
import { RowDataPacket } from 'mysql2';

/**
 * Model quản lý các thao tác với bảng 'users'
 */
const User = {
  /**
   * Lấy danh sách toàn bộ người dùng
   * @returns {Promise<UserInterface[]>} Danh sách người dùng
   */
  getAll: async (): Promise<UserInterface[]> => {
    try {
      const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users');
      return rows as UserInterface[];
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Lỗi khi lấy danh sách người dùng: ${error.message}`);
      }
      throw new Error('Lỗi không xác định khi truy vấn database');
    }
  },

  /**
   * Lấy chi tiết một người dùng theo ID
   * @param {number} id ID của người dùng
   * @returns {Promise<UserInterface | null>} Thông tin người dùng hoặc null
   */
  getById: async (id: number): Promise<UserInterface | null> => {
    try {
      const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [id]);
      const user = rows[0] as UserInterface | undefined;
      return user || null;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Lỗi khi lấy thông tin người dùng: ${error.message}`);
      }
      throw new Error('Lỗi không xác định khi truy vấn database');
    }
  },
  
  /**
   * Tìm kiếm người dùng theo email
   * @param {string} email Email cần tìm
   * @returns {Promise<UserInterface | null>} Thông tin người dùng hoặc null
   */
  findByEmail: async (email: string): Promise<UserInterface | null> => {
    try {
      const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
      const user = rows[0] as UserInterface | undefined;
      return user || null;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Lỗi khi tìm người dùng theo email: ${error.message}`);
      }
      throw new Error('Lỗi không xác định khi truy vấn database');
    }
  }
};

export default User;
