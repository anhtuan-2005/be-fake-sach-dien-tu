CREATE DATABASE IF NOT EXISTS appdb;
USE appdb;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_code VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  account_type ENUM('Giáo viên', 'Học sinh', 'Admin') DEFAULT 'Học sinh',
  level VARCHAR(50),
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert dummy data
INSERT INTO users (user_code, full_name, account_type, level, email, password, phone) VALUES
('GV001', 'Nguyễn Văn A', 'Giáo viên', 'Cấp 1', 'gv001@email.com', '123456', '0123456789'),
('HS001', 'Trần Thị B', 'Học sinh', 'Lớp 5', 'hs001@email.com', '123456', '0987654321'),
('HS002', 'Lê Văn C', 'Học sinh', 'Lớp 4', 'hs002@email.com', '123456', '0909090909'),
('ADMIN', 'Quản trị viên', 'Admin', 'Toàn quyền', 'testitdn@gmail.com', 'sachso', '0000000000');
