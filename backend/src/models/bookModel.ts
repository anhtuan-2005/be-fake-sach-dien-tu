import db from '../config/db';
import { Book as BookInterface } from '../types';
import { RowDataPacket } from 'mysql2';

/**
 * Model quản lý các thao tác với bảng 'books'
 */
const Book = {
  /**
   * Lấy danh sách toàn bộ sách
   * @returns {Promise<BookInterface[]>} Danh sách sách
   */
  getAll: async (): Promise<BookInterface[]> => {
    try {
      const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM books');
      return rows as BookInterface[];
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Lỗi khi lấy danh sách sách: ${error.message}`);
      }
      throw new Error('Lỗi không xác định khi truy vấn database');
    }
  },

  /**
   * Lấy chi tiết một cuốn sách theo ID
   * @param {number} id ID của sách
   * @returns {Promise<BookInterface | null>} Thông tin sách hoặc null
   */
  getById: async (id: number): Promise<BookInterface | null> => {
    try {
      const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM books WHERE id = ?', [id]);
      const book = rows[0] as BookInterface | undefined;
      return book || null;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Lỗi khi lấy thông tin sách: ${error.message}`);
      }
      throw new Error('Lỗi không xác định khi truy vấn database');
    }
  }
};

export default Book;
