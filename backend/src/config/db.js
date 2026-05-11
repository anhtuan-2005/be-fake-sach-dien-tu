const mysql = require("mysql2/promise");
require("dotenv").config();

/**
 * Cấu hình kết nối Database
 * Đã sửa SSL để chấp nhận kết nối qua IP
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST, // Sẽ lấy IP 75.2.106.174 từ file .env
  port: process.env.DB_PORT || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // QUAN TRỌNG: Khi dùng IP, phải để rejectUnauthorized: false
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false 
  }
});

module.exports = pool;