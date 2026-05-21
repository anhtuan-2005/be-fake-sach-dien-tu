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
   * Tìm kiếm và lọc người dùng nâng cao với phân trang
   * @param filters Các tiêu chí lọc
   * @param showDeleted Có lấy cả người dùng đã xóa mềm hay không
   * @param page Trang hiện tại
   * @param limit Số lượng bản ghi mỗi trang
   */
  search: async (filters: any, showDeleted: boolean = false, page: number = 1, limit: number = 10): Promise<{ users: UserInterface[], total: number }> => {
    try {
      console.log('>>> UserModel: Received filters:', filters, 'showDeleted:', showDeleted, 'page:', page, 'limit:', limit);
      
      let baseQuery = ' FROM users WHERE 1=1';
      const queryParams: any[] = [];

      // Mặc định chỉ lấy người chưa xóa mềm
      if (!showDeleted) {
        baseQuery += ' AND deleted_at IS NULL';
      } else {
        baseQuery += ' AND deleted_at IS NOT NULL';
      }

      // 1. Mapping role từ FE sang DB (Tiếng Việt)
      let roleValue = filters.role;
      if (roleValue === 'ADMIN') roleValue = 'Admin';
      if (roleValue === 'TEACHER') roleValue = 'Giáo viên';
      if (roleValue === 'STUDENT') roleValue = 'Học sinh';

      if (roleValue && roleValue !== 'all') {
        baseQuery += ' AND account_type = ?';
        queryParams.push(roleValue);
      }

      // 2. Lọc theo Cấp
      if (filters.level && filters.level !== 'all') {
        baseQuery += ' AND level = ?';
        queryParams.push(filters.level);
      }

      // 3. Lọc theo Tỉnh/Thành phố
      if (filters.province && filters.province !== 'all') {
        baseQuery += ' AND province_id = ?';
        queryParams.push(filters.province);
      }

      // 4. Lọc theo Xã/Phường
      if (filters.district && filters.district !== 'all') {
        baseQuery += ' AND ward_id = ?';
        queryParams.push(filters.district);
      }

      // 5. Lọc theo Trường học
      if (filters.school && filters.school.trim() !== '') {
        baseQuery += ' AND school_name LIKE ?';
        queryParams.push(`%${filters.school}%`);
      }

      // 6. Lọc theo Số điện thoại
      if (filters.phone && filters.phone.trim() !== '') {
        baseQuery += ' AND phone LIKE ?';
        queryParams.push(`%${filters.phone}%`);
      }

      // 7. Lọc theo Email
      if (filters.email && filters.email.trim() !== '') {
        baseQuery += ' AND email LIKE ?';
        queryParams.push(`%${filters.email}%`);
      }

      // Đếm tổng số bản ghi
      const countQuery = 'SELECT COUNT(*) as total' + baseQuery;
      const [countResult] = await db.query<RowDataPacket[]>(countQuery, queryParams);
      const total = countResult[0].total;

      // Lấy dữ liệu phân trang
      const offset = (page - 1) * limit;
      const dataQuery = 'SELECT *' + baseQuery + ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      const dataParams = [...queryParams, limit, offset];

      console.log('--- SQL QUERY EXECUTION ---');
      console.log('Data SQL:', dataQuery);
      console.log('Params:', JSON.stringify(dataParams));
      console.log('---------------------------');

      const [rows] = await db.query<RowDataPacket[]>(dataQuery, dataParams);
      return {
        users: rows as UserInterface[],
        total
      };
    } catch (error: unknown) {
      console.error('>>> UserModel Search Error:', error);
      if (error instanceof Error) {
        throw new Error(`Lỗi khi tìm kiếm người dùng: ${error.message}`);
      }
      throw new Error('Lỗi không xác định khi truy vấn database');
    }
  },

  /**
   * Tạo người dùng mới
   */
  create: async (userData: Partial<UserInterface>): Promise<number> => {
    try {
      const { full_name, email, phone, account_type, level, user_code, password } = userData;
      const [result] = await db.query<any>(
        'INSERT INTO users (full_name, email, phone, account_type, level, user_code, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [full_name, email, phone, account_type, level, user_code, password]
      );
      return result.insertId;
    } catch (error: unknown) {
      console.error('>>> UserModel Create Error:', error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin người dùng
   */
  update: async (id: number, userData: Partial<UserInterface>): Promise<boolean> => {
    try {
      const oldUser = await User.getById(id);
      if (!oldUser) return false;

      // Hợp nhất dữ liệu cũ và mới để tránh mất dữ liệu hoặc lỗi NULL
      const full_name = userData.full_name !== undefined ? userData.full_name : oldUser.full_name;
      const email = userData.email !== undefined ? userData.email : oldUser.email;
      const phone = userData.phone !== undefined ? userData.phone : oldUser.phone;
      const account_type = userData.account_type !== undefined ? userData.account_type : oldUser.account_type;
      const level = userData.level !== undefined ? userData.level : oldUser.level;
      const user_code = userData.user_code !== undefined ? userData.user_code : oldUser.user_code;
      const avatar_url = userData.avatar_url !== undefined ? userData.avatar_url : oldUser.avatar_url;

      const [result] = await db.query<any>(
        'UPDATE users SET full_name = ?, email = ?, phone = ?, account_type = ?, level = ?, user_code = ?, avatar_url = ? WHERE id = ?',
        [full_name, email, phone, account_type, level, user_code, avatar_url, id]
      );
      return result.affectedRows > 0;
    } catch (error: unknown) {
      console.error('>>> UserModel Update Error:', error);
      throw error;
    }
  },

  /**
   * Cập nhật mật khẩu người dùng
   */
  updatePassword: async (id: number, passwordHash: string): Promise<boolean> => {
    try {
      const [result] = await db.query<any>(
        'UPDATE users SET password = ? WHERE id = ?',
        [passwordHash, id]
      );
      return result.affectedRows > 0;
    } catch (error: unknown) {
      console.error('>>> UserModel UpdatePassword Error:', error);
      throw error;
    }
  },

  /**
   * Xóa mềm người dùng
   */
  softDelete: async (id: number): Promise<boolean> => {
    try {
      const [result] = await db.query<any>(
        'UPDATE users SET deleted_at = NOW() WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error: unknown) {
      console.error('>>> UserModel SoftDelete Error:', error);
      throw error;
    }
  },

  /**
   * Khôi phục người dùng đã xóa mềm
   */
  restore: async (id: number): Promise<boolean> => {
    try {
      const [result] = await db.query<any>(
        'UPDATE users SET deleted_at = NULL WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error: unknown) {
      console.error('>>> UserModel Restore Error:', error);
      throw error;
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
