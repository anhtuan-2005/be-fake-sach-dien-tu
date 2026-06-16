import { Router } from 'express';
import { TypeConfigController } from './typeConfig.controller';
import { verifyToken } from '../../middleware/authMiddleware';
import { authorize } from '../../middleware/authorize';
import { validateDto } from '../../middleware/validation.middleware';
import { CreateTypeConfigDto, UpdateTypeConfigDto } from './typeConfig.dto';

const router = Router();

// Tất cả các route quản lý cấu hình thể loại yêu cầu đăng nhập với vai trò 'admin'
router.use(verifyToken);
router.use(authorize(['admin']));

// Lấy danh sách cấu hình thể loại
router.get('/', TypeConfigController.getAllConfigs);

// Tạo cấu hình thể loại mới
router.post('/', validateDto(CreateTypeConfigDto), TypeConfigController.createConfig);

// Cập nhật cấu hình thể loại theo ID
router.put('/:id', validateDto(UpdateTypeConfigDto), TypeConfigController.updateConfig);

export default router;
