import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Request } from 'express';
import dotenv from 'dotenv';

dotenv.config();

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
    return {
      folder: 'avatars', // Thư mục lưu trữ trên Cloudinary
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      public_id: `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

// Bộ lọc file (vẫn giữ lại để kiểm tra mime type trước khi upload)
const fileFilter = (req: Request, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
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
