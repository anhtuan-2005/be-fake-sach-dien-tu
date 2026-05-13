import { Request, Response } from 'express';
import User from '../models/userModel';
import { ApiResponse, User as UserInterface } from '../types';

/**
 * Controller quản lý các logic nghiệp vụ liên quan đến người dùng
 */
const userController = {
  /**
   * Lấy danh sách toàn bộ người dùng
   * @param {Request} req Express Request
   * @param {Response} res Express Response
   * @returns {Promise<void>}
   */
  getUsers: async (req: Request, res: Response): Promise<void> => {
    try {
      const users: UserInterface[] = await User.getAll();
      
      const response: ApiResponse<UserInterface[]> = {
        success: true,
        data: users
      };
      
      res.status(200).json(response);
    } catch (error: unknown) {
      console.error('Error fetching users:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Lỗi khi lấy danh sách người dùng',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      res.status(500).json(response);
    }
  },

  /**
   * Lấy chi tiết một người dùng
   * @param {Request} req Express Request
   * @param {Response} res Express Response
   * @returns {Promise<void>}
   */
  getUserById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: idParam } = req.params;
      const id = parseInt(idParam as string);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'ID người dùng không hợp lệ'
        });
        return;
      }

      const user = await User.getById(id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
        return;
      }

      const response: ApiResponse<UserInterface> = {
        success: true,
        data: user
      };
      
      res.status(200).json(response);
    } catch (error: unknown) {
      console.error('Error fetching user details:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Lỗi khi lấy thông tin người dùng',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      res.status(500).json(response);
    }
  }
};

export default userController;
