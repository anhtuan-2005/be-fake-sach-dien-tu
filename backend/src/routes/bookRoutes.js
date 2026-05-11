const express = require('express');
const router = express.Router();

// Import pool kết nối database đã cấu hình sẵn (hỗ trợ TiDB)
const pool = require('../config/db');

// API lấy danh sách toàn bộ sách
// Đường dẫn gốc '/' ở đây sẽ tương ứng với '/api/books' được khai báo ở server.js
router.get('/', async (req, res) => {
  try {
    // Thực hiện truy vấn lấy toàn bộ dữ liệu từ bảng books
    const [rows] = await pool.query('SELECT * FROM books');

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sách',
    });
  }
});

// Quan trọng: Xuất router để có thể import và sử dụng ở server.js
module.exports = router;
