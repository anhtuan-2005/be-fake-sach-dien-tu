const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookRoutes = require('./routes/bookRoutes');

const app = express();

// Sử dụng port từ Render cấp hoặc mặc định là 10000 nếu chạy local
const PORT = process.env.PORT || 10000;

// Middleware
// Khi đã deploy xong, bạn có thể thay cors() thành cors({ origin: 'link-vercel-cua-ban' }) để bảo mật
app.use(cors()); 
app.use(express.json());

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