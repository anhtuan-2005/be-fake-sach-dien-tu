/**
 * Interface đại diện cho người dùng trong hệ thống
 * Khớp 100% với bảng 'users' thực tế trên TiDB
 */
export interface User {
  id: number;
  user_code: string | null;
  full_name: string;
  account_type: string | null;
  level: string | null;
  province_id: number | null;
  ward_id: number | null;
  school_id: number | null;
  email: string;
  password: string | null;
  phone: string | null;
  status: number; // tinyint(1) trong SQL trả về number (0 hoặc 1)
  role: string;
  created_at: Date;
}

/**
 * Interface cho đối tượng Sách
 * Khớp 100% với bảng 'books' thực tế trên TiDB
 */
export interface Book {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  price: string | number; // Decimal trong SQL thường trả về string
  category_id: number | null;
  created_at: Date;
}

/**
 * Interface cho Danh mục
 */
export interface Category {
  id: number;
  name: string;
}

/**
 * Interface cho Tỉnh/Thành phố
 */
export interface Province {
  id: number;
  name: string;
}

/**
 * Interface cho Phường/Xã
 */
export interface Ward {
  id: number;
  province_id: number;
  name: string;
}

/**
 * Interface cho Trường học
 */
export interface School {
  id: number;
  name: string;
  province_id: number | null;
}

/**
 * Interface cho Nhật ký hoạt động
 */
export interface ActionLog {
  id: number;
  user_id: number | null;
  action: string;
  device: string | null;
  created_at: Date;
}

/**
 * Interface cho dữ liệu giải mã từ JWT
 */
export interface JWTPayload {
  id: number;
  email: string;
  role: string;
}

/**
 * Cấu trúc phản hồi chuẩn từ API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Dữ liệu đăng nhập
 */
export interface LoginDto {
  email: string;
  password: string;
}
