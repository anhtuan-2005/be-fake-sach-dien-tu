import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Request } from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Chấp nhận cả CLOUDINARY_NAME hoặc CLOUDINARY_CLOUD_NAME
const cloudName = process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Kiểm tra chi tiết biến môi trường
const missingKeys = [];
if (!cloudName) missingKeys.push('CLOUDINARY_NAME (hoặc CLOUDINARY_CLOUD_NAME)');
if (!apiKey) missingKeys.push('CLOUDINARY_API_KEY');
if (!apiSecret) missingKeys.push('CLOUDINARY_API_SECRET');

if (missingKeys.length > 0) {
  console.error(`❌ CRITICAL ERROR: Missing Cloudinary keys: ${missingKeys.join(', ')}`);
} else {
  console.log('✅ Cloudinary environment variables loaded successfully');
}

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
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
