const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookRoutes = require('./routes/bookRoutes');

const app = express();

// Sử dụng port từ Render cấp hoặc mặc định là 10000 nếu chạy local
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Địa chỉ frontend của bạn
  credentials: true // Cho phép gửi cookie
})); 
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/books', bookRoutes);

// Test route - Giúp bạn kiểm tra nhanh link Render có sống hay không
app.get('/', (req, res) => {
  res.send('API Backend của Tuấn Anh đang chạy thành công rực rỡ!');
});

// Quan trọng: Thêm '0.0.0.0' để Render có thể bind vào cổng thành công
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server đang chạy thành công trên port ${PORT}`);
});