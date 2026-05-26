import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Xóa ảnh cũ khi cập nhật ảnh mới (Hỗ trợ cả Local và Cloudinary)
 * @param avatarUrl URL của ảnh cũ cần xóa
 */
export const deleteOldAvatar = async (avatarUrl: string | null | undefined): Promise<void> => {
  if (!avatarUrl || avatarUrl.includes('default-avatar')) return;

  try {
    // 1. Trường hợp là ảnh trên Cloudinary
    if (avatarUrl.includes('cloudinary.com')) {
      // Extract public_id từ URL
      // URL format: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[folder]/[public_id].[extension]
      const parts = avatarUrl.split('/');
      const filenameWithExtension = parts.pop();
      const folder = parts.pop();
      
      if (filenameWithExtension && folder) {
        const publicId = `${folder}/${filenameWithExtension.split('.')[0]}`;
        console.log(`>>> Cloudinary: Deleting old avatar - public_id: ${publicId}`);
        await cloudinary.uploader.destroy(publicId);
      }
    } 
    // 2. Trường hợp là ảnh local
    else {
      let localPath = '';
      
      if (avatarUrl.startsWith('http')) {
        const urlParts = avatarUrl.split('/');
        const uploadsIndex = urlParts.indexOf('uploads');
        if (uploadsIndex !== -1) {
          localPath = path.join(process.cwd(), ...urlParts.slice(uploadsIndex));
        }
      } else {
        // Nếu là relative path trong DB (ví dụ: uploads/avatars/...)
        localPath = path.join(process.cwd(), avatarUrl);
      }

      if (localPath && existsSync(localPath)) {
        console.log(`>>> Local: Deleting old avatar - path: ${localPath}`);
        await fs.unlink(localPath);
      }
    }
  } catch (error) {
    console.error('>>> Error in deleteOldAvatar:', error);
  }
};
