import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import routes (TS sẽ tự nhận diện .ts hoặc .js nếu chưa đổi hết)
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import bookRoutes from './routes/bookRoutes';

dotenv.config();

const app: Application = express();

// Sử dụng port từ Render cấp hoặc mặc định là 10000 nếu chạy local
const PORT: string | number = process.env.PORT || 10000;

// Middleware
const allowedOrigins: string[] = [
  'http://localhost:5173',
  'https://fe-fake-sach-dien-tu.vercel.app'
];

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Cho phép các request không có origin (như Postman hoặc các ứng dụng server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Không được phép bởi CORS Policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); 

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/books', bookRoutes);

// Test route
app.get('/', (req: Request, res: Response) => {
  res.send('API Backend của Tuấn Anh đang chạy thành công rực rỡ (TypeScript version)!');
});

// Error handling middleware (optional but good practice)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Có lỗi xảy ra!');
});

// Quan trọng: Thêm '0.0.0.0' để Render có thể bind vào cổng thành công
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server TypeScript đang chạy thành công trên port ${PORT}`);
});
