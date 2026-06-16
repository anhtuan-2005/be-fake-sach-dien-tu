/**
 * DTO (Data Transfer Object) cho các yêu cầu liên quan đến Profile
 */

// Cập nhật thông tin cá nhân
export interface UpdateProfileDto {
  full_name?: string;
  email?: string;
  phone?: string;
  level?: string | null;
  // Có thể thêm các trường khác nếu cần
}

// Đổi mật khẩu
export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

// Kết quả trả về sau khi validate (tùy chọn)
export interface ProfileValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Hàm validate đơn giản cho UpdateProfile
 */
export const validateUpdateProfile = (data: UpdateProfileDto): ProfileValidationResult => {
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { isValid: false, message: 'Email không đúng định dạng' };
  }
  if (data.full_name && data.full_name.trim().length < 2) {
    return { isValid: false, message: 'Họ tên phải có ít nhất 2 ký tự' };
  }
  return { isValid: true };
};

/**
 * Hàm validate cho ChangePassword
 */
export const validateChangePassword = (data: ChangePasswordDto): ProfileValidationResult => {
  if (!data.oldPassword || !data.newPassword) {
    return { isValid: false, message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới' };
  }
  if (data.newPassword.length < 6) {
    return { isValid: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
  }
  if (data.oldPassword === data.newPassword) {
    return { isValid: false, message: 'Mật khẩu mới không được trùng với mật khẩu cũ' };
  }
  return { isValid: true };
};
