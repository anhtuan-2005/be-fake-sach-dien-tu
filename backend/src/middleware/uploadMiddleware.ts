import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Request } from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Kiểm tra biến môi trường
if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ CRITICAL ERROR: Cloudinary environment variables are missing!');
} else {
  console.log('✅ Cloudinary environment variables loaded');
}

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình Cloudinary Storage cho Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: any) => {
    console.log('>>> CloudinaryStorage: Preparing params for file:', file.originalname);
    return {
      folder: 'avatars',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      public_id: `avatar-${Date.now()}`
    };
  },
} as any);

// Bộ lọc file
const fileFilter = (req: Request, file: any, cb: any) => {
  console.log('>>> Multer fileFilter: processing file:', file.originalname, 'mimetype:', file.mimetype);
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error('>>> Multer fileFilter Error: Invalid file type:', file.mimetype);
    cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)'), false);
  }
};

export const uploadAvatar = multer({
  storage: storage as any, // Ép kiểu any để tránh lỗi tsc nếu có sự khác biệt giữa các version thư viện
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});
