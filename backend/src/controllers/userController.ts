import { Request, Response } from 'express';
import User from '../models/userModel';
import { ApiResponse, User as UserInterface } from '../types';
import { createActivityLog } from '../utils/logger';

/**
 * Controller quản lý các logic nghiệp vụ liên quan đến người dùng
 */
const userController = {
  /**
   * Lấy danh sách toàn bộ người dùng với phân trang
   * @param {Request} req Express Request
   * @param {Response} res Express Response
   * @returns {Promise<void>}
   */
  getUsers: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('>>> userController: Received request for getUsers');
      console.log('>>> Query Params:', JSON.stringify(req.query, null, 2));
      
      // Tiếp nhận Query Parameters từ URL
      const { 
        role, 
        level, 
        province, 
        district, 
        school, 
        phone, 
        email,
        showDeleted,
        page,
        limit
      } = req.query;

      const filters = {
        role: role as string,
        level: level as string,
        province: province as string,
        district: district as string,
        school: school as string,
        phone: phone as string,
        email: email as string
      };

      const isTrash = (showDeleted as string) === 'true';
      const currentPage = parseInt(page as string) || 1;
      const pageSize = parseInt(limit as string) || 10;

      // Gọi model search với các bộ lọc và phân trang
      const { users, total } = await User.search(filters, isTrash, currentPage, pageSize);
      
      console.log(`>>> userController: Successfully fetched ${users.length} users (Trash: ${isTrash})`);
      
      const response: ApiResponse<UserInterface[]> = {
        success: true,
        data: users,
        pagination: {
          currentPage,
          totalPages: Math.ceil(total / pageSize),
          totalItems: total,
          itemsPerPage: pageSize
        }
      };
      
      res.status(200).json(response);
    } catch (error: unknown) {
      console.error('>>> CRITICAL ERROR in userController.getUsers:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Lỗi server khi lấy danh sách người dùng',
        error: error instanceof Error ? error.message : 'Unknown internal server error'
      };
      
      res.status(500).json(response);
    }
  },

  /**
   * Tạo người dùng mới
   */
  createUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const userData = req.body;
      const insertId = await User.create(userData);
      
      // Ghi log hoạt động
      await createActivityLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'CREATE',
        targetUserId: insertId,
        description: `Tạo người dùng mới: ${userData.full_name}`,
        newValues: userData,
        ipAddress: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'Tạo người dùng thành công',
        data: { id: insertId }
      });
    } catch (error: any) {
      console.error('>>> userController: Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo người dùng',
        error: error.message
      });
    }
  },

  /**
   * Cập nhật người dùng
   */
  updateUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: idParam } = req.params;
      const id = parseInt(idParam as string);
      const userData = req.body;
      
      // 1. Kiểm tra người dùng có tồn tại không
      const oldUser = await User.getById(id);
      if (!oldUser) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng để cập nhật'
        });
        return;
      }
      
      // 2. Thực hiện cập nhật
      const success = await User.update(id, userData);
      
      // 3. Ghi log hoạt động (Ghi log ngay cả khi success là false do không có gì thay đổi, 
      // nhưng thực tế User.update trả về true nếu query thành công trong một số trường hợp, 
      // hoặc chúng ta coi việc bấm Save là một thao tác cần ghi nhận)
      await createActivityLog({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'UPDATE',
        targetUserId: id,
        description: `Cập nhật thông tin người dùng: ${oldUser.full_name}`,
        oldValues: oldUser,
        newValues: userData,
        ipAddress: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật người dùng thành công'
      });
    } catch (error: any) {
      console.error('>>> userController: Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật người dùng',
        error: error.message
      });
    }
  },

  /**
   * Xóa mềm người dùng
   */
  softDeleteUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = parseInt(id as string);

      if (req.user && req.user.id === userId) {
        res.status(403).json({
          success: false,
          message: 'Bạn không thể tự xóa tài khoản của chính mình'
        });
        return;
      }

      // 1. Kiểm tra tồn tại
      const oldUser = await User.getById(userId);
      if (!oldUser) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng để xóa'
        });
        return;
      }

      // CHẶN XÓA ADMIN HỆ THỐNG
      if (oldUser.email === 'testitdn@gmail.com') {
        res.status(400).json({
          success: false,
          message: 'Không thể xóa tài khoản Admin tối cao của hệ thống!'
        });
        return;
      }

      // 2. Thực hiện xóa mềm
      const success = await User.softDelete(userId);
      if (success) {
        // 3. Ghi log hoạt động
        await createActivityLog({
          userId: req.user?.id,
          userEmail: req.user?.email,
          action: 'DELETE',
          targetUserId: userId,
          description: `Xóa mềm người dùng: ${oldUser.full_name}`,
          oldValues: oldUser,
          ipAddress: req.ip
        });

        res.status(200).json({
          success: true,
          message: 'Đã chuyển người dùng vào thùng rác'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Lỗi khi xóa người dùng'
        });
      }
    } catch (error: any) {
      console.error('>>> userController: Error soft deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa người dùng',
        error: error.message
      });
    }
  },

  /**
   * Khôi phục người dùng
   */
  restoreUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = parseInt(id as string);
      
      const success = await User.restore(userId);
      
      if (success) {
        // Lấy lại data sau khi khôi phục để ghi log
        const restoredUser = await User.getById(userId);
        
        // Ghi log hoạt động
        await createActivityLog({
          userId: req.user?.id,
          userEmail: req.user?.email,
          action: 'UPDATE', // Khôi phục cũng là một dạng update trạng thái
          targetUserId: userId,
          description: `Khôi phục người dùng: ${restoredUser?.full_name || id}`,
          newValues: restoredUser,
          ipAddress: req.ip
        });

        res.status(200).json({
          success: true,
          message: 'Khôi phục người dùng thành công'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }
    } catch (error: any) {
      console.error('>>> userController: Error restoring user:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi khôi phục người dùng',
        error: error.message
      });
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
  },

  /**
   * Cập nhật thông tin cá nhân người dùng
   */
  updateProfile: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: idParam } = req.params;
      const id = parseInt(idParam as string);
      let userData = req.body;

      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID không hợp lệ' });
        return;
      }

      // Kiểm tra quyền: Chỉ admin hoặc chính người dùng đó mới được sửa
      if (req.user?.role !== 'Admin' && req.user?.id !== id) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này' });
        return;
      }

      // Mapping role từ FE sang account_type của DB nếu có
      if (userData.role) {
        userData.account_type = userData.role === 'admin' ? 'Admin' : 
                                userData.role === 'user' ? 'Học sinh' : userData.role;
      }

      const success = await User.update(id, userData);

      if (success) {
        const updatedUser = await User.getById(id);
        res.status(200).json({
          success: true,
          message: 'Cập nhật thông tin thành công',
          data: updatedUser
        });
      } else {
        res.status(404).json({ success: false, message: 'Không tìm thấy người dùng hoặc không có thay đổi' });
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật thông tin', error: error.message });
    }
  },

  /**
   * Upload ảnh đại diện
   */
  uploadAvatar: async (req: Request, res: Response): Promise<void> => {
    try {
      const file = (req as any).file;

      if (!file) {
        res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh' });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
        return;
      }

      // Khi sử dụng Cloudinary, URL sẽ nằm trong file.path hoặc file.cloudinaryUrl
      const avatarUrl = file.path || (file as any).cloudinaryUrl;

      // Cập nhật vào DB
      const user = await User.getById(userId);
      if (user) {
        await User.update(userId, { ...user, avatar_url: avatarUrl });
      }

      res.status(200).json({
        success: true,
        message: 'Tải ảnh lên thành công',
        data: { url: avatarUrl }
      });
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server khi tải ảnh lên', error: error.message });
    }
  }
};

export default userController;
