import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Cấu hình kết nối Database (TiDB)
 * Sử dụng mysql2/promise và định nghĩa kiểu dữ liệu Pool
 */
const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '4000'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // QUAN TRỌNG: Khi dùng IP/TiDB, phải để rejectUnauthorized: false
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false 
  }
});

export default pool;
