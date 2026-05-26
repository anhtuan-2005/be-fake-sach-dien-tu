CREATE DATABASE IF NOT EXISTS appdb;
USE appdb;

-- Bảng Tỉnh/Thành phố
CREATE TABLE IF NOT EXISTS provinces (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Bảng Phường/Xã
CREATE TABLE IF NOT EXISTS wards (
  id INT PRIMARY KEY,
  province_id INT,
  name VARCHAR(100) NOT NULL,
  FOREIGN KEY (province_id) REFERENCES provinces(id)
);

-- Bảng Trường học
CREATE TABLE IF NOT EXISTS schools (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  province_id INT,
  FOREIGN KEY (province_id) REFERENCES provinces(id)
);

-- Bảng Người dùng
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_code VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  account_type ENUM('Giáo viên', 'Học sinh', 'Admin') DEFAULT 'Học sinh',
  level VARCHAR(50),
  province_id INT,
  ward_id INT,
  school_id INT,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  status TINYINT(1) DEFAULT 1,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (province_id) REFERENCES provinces(id),
  FOREIGN KEY (ward_id) REFERENCES wards(id),
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- Bảng Lớp học
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_code VARCHAR(50) UNIQUE NOT NULL,
  class_name VARCHAR(100) NOT NULL,
  description TEXT,
  status TINYINT(1) DEFAULT 1,
  teacher_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Bảng Học sinh - Lớp học (Quan hệ n-n)
CREATE TABLE IF NOT EXISTS student_classes (
  class_id INT,
  student_id INT,
  status TINYINT(1) DEFAULT 0,
  PRIMARY KEY (class_id, student_id),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng Danh mục sách
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Bảng Sách
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(100),
  description TEXT,
  price DECIMAL(10, 2),
  category_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Bảng Nhật ký hoạt động
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  user_email VARCHAR(100),
  action VARCHAR(50),
  target_user_id INT,
  description TEXT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chèn dữ liệu mẫu
INSERT INTO users (user_code, full_name, account_type, level, email, password, phone) VALUES
('GV001', 'Nguyễn Văn A', 'Giáo viên', 'Cấp 1', 'gv001@email.com', '123456', '0123456789'),
('HS001', 'Trần Thị B', 'Học sinh', 'Cấp 1', 'hs001@email.com', '123456', '0987654321'),
('HS002', 'Lê Văn C', 'Học sinh', 'Cấp 1', 'hs002@email.com', '123456', '0909090909'),
('ADMIN', 'Quản trị viên', 'Admin', 'Toàn quyền', 'testitdn@gmail.com', 'sachso', '0000000000')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);
