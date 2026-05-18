import { Request, Response } from 'express';
import db from '../config/db';
import { ApiResponse, ActivityLog } from '../types';
import { RowDataPacket } from 'mysql2';

const activityLogController = {
  /**
   * Lấy danh sách lịch sử thao tác với bộ lọc và phân trang
   */
  getLogs: async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 5;
      const offset = (page - 1) * limit;
      
      const { action, searchEmail, startDate, endDate } = req.query;
      
      let query = 'SELECT * FROM activity_logs WHERE 1=1';
      let countQuery = 'SELECT COUNT(*) as total FROM activity_logs WHERE 1=1';
      const queryParams: any[] = [];
      
      // 1. Bộ lọc Action
      if (action && action !== 'all') {
        query += ' AND action = ?';
        countQuery += ' AND action = ?';
        queryParams.push(action);
      }
      
      // 2. Bộ lọc Email
      if (searchEmail) {
        query += ' AND user_email LIKE ?';
        countQuery += ' AND user_email LIKE ?';
        queryParams.push(`%${searchEmail}%`);
      }
      
      // 3. Bộ lọc Khoảng ngày
      if (startDate) {
        query += ' AND created_at >= ?';
        countQuery += ' AND created_at >= ?';
        queryParams.push(`${startDate} 00:00:00`);
      }
      if (endDate) {
        query += ' AND created_at <= ?';
        countQuery += ' AND created_at <= ?';
        queryParams.push(`${endDate} 23:59:59`);
      }
      
      // Sắp xếp và phân trang
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      const logsParams = [...queryParams, limit, offset];
      
      // Thực thi truy vấn
      const [logs] = await db.query<RowDataPacket[]>(query, logsParams);
      const [totalResult] = await db.query<RowDataPacket[]>(countQuery, queryParams);
      
      const total = totalResult[0].total;
      const totalPages = Math.ceil(total / limit);
      
      res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit
        }
      });
    } catch (error: any) {
      console.error('>>> activityLogController Error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy lịch sử thao tác',
        error: error.message
      });
    }
  }
};

export default activityLogController;
