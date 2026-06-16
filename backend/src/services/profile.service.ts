import bcrypt from 'bcrypt';
import { UserModel } from '../models/user.model';
import { ChangePasswordDto, UpdateProfileDto } from '../dtos/profile.dto';
import { User as UserInterface } from '../types';

/**
 * Service xử lý logic nghiệp vụ cho Profile
 */
export class ProfileService {
  /**
   * Cập nhật thông tin cơ bản
   */
  static async updateProfile(userId: number, data: UpdateProfileDto, userRole: string): Promise<UserInterface | null> {
    // 1. Lấy thông tin user hiện tại để đối chiếu
    const existingUser = await UserModel.findUserById(userId);
    if (!existingUser) return null;

    // 2. Nếu req.user.role === 'teacher' mà dữ liệu gửi lên (req.body.level) có sự thay đổi so với dữ liệu cũ trong DB, lập tức từ chối
    if (userRole && userRole.toLowerCase() === 'teacher') {
      if (data.level !== undefined && data.level !== existingUser.level) {
        const error: any = new Error('Giáo viên không có quyền chỉnh sửa thông tin Tổ bộ môn');
        error.statusCode = 403;
        throw error;
      }
    }

    // 3. Nếu là Admin và chọn giá trị level là "N/A" (hoặc null), tự động gán NULL
    if (userRole && userRole.toLowerCase() === 'admin') {
      if (data.level === 'N/A' || data.level === null) {
        data.level = null;
      }
    }

    const success = await UserModel.updateUserProfile(userId, data);
    if (!success) return null;
    return await UserModel.findUserById(userId);
  }

  /**
   * Cập nhật ảnh đại diện
   */
  static async updateAvatar(userId: number, avatarUrl: string): Promise<boolean> {
    return await UserModel.updateUserProfile(userId, { avatar_url: avatarUrl });
  }

  /**
   * Đổi mật khẩu với kiểm tra bảo mật bcrypt
   */
  static async changePassword(userId: number, data: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    // 1. Tìm user
    const user = await UserModel.findUserById(userId);
    if (!user) {
      return { success: false, message: 'Người dùng không tồn tại' };
    }

    // 2. Kiểm tra mật khẩu cũ
    // Hỗ trợ cả bcrypt và plaintext (cho dữ liệu cũ nếu có)
    let isMatch = false;
    if (user.password && user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(data.oldPassword, user.password);
    } else {
      isMatch = user.password === data.oldPassword;
    }

    if (!isMatch) {
      return { success: false, message: 'Mật khẩu cũ không chính xác' };
    }

    // 3. Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(data.newPassword, salt);

    // 4. Cập nhật vào DB
    const success = await UserModel.updateUserPassword(userId, hashedNewPassword);
    
    if (success) {
      return { success: true, message: 'Đổi mật khẩu thành công' };
    } else {
      return { success: false, message: 'Lỗi khi cập nhật mật khẩu' };
    }
  }
}
