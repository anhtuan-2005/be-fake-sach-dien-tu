import { Request, Response } from 'express';
import { TypeConfigService } from './typeConfig.service';
import { createActivityLog } from '../../utils/logger';

export const TypeConfigController = {
  /**
   * API Lấy danh sách tất cả các cấu hình thể loại
   */
  getAllConfigs: async (req: Request, res: Response): Promise<void> => {
    try {
      const configs = await TypeConfigService.getAllConfigs();
      res.status(200).json({
        success: true,
        message: 'Lấy danh sách cấu hình thể loại thành công.',
        data: configs
      });
    } catch (error: any) {
      console.error('getAllConfigs controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách cấu hình thể loại.',
        error: error.message
      });
    }
  },

  /**
   * API Tạo mới cấu hình thể loại
   */
  createConfig: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      const newConfig = await TypeConfigService.createConfig(req.body);

      // Ghi log lịch sử hoạt động
      await createActivityLog({
        userId,
        userEmail,
        action: 'CREATE',
        description: `Tạo mới cấu hình thể loại ID: ${newConfig.id} - Type: ${newConfig.type} - OptionType: ${newConfig.option_type}`,
        newValues: newConfig
      });

      res.status(201).json({
        success: true,
        message: 'Tạo cấu hình thể loại thành công.',
        data: newConfig
      });
    } catch (error: any) {
      console.error('createConfig controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo cấu hình thể loại.',
        error: error.message
      });
    }
  },

  /**
   * API Cập nhật cấu hình thể loại theo ID
   */
  updateConfig: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'Mã cấu hình không hợp lệ.'
        });
        return;
      }

      // Lấy thông tin cấu hình cũ để ghi log hoạt động
      const oldConfig = await TypeConfigService.getConfigById(id);
      if (!oldConfig) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy cấu hình thể loại cần cập nhật.'
        });
        return;
      }

      const updatedConfig = await TypeConfigService.updateConfig(id, req.body);

      // Ghi log lịch sử hoạt động
      await createActivityLog({
        userId,
        userEmail,
        action: 'UPDATE',
        description: `Cập nhật cấu hình thể loại ID: ${id}`,
        oldValues: oldConfig,
        newValues: updatedConfig
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật cấu hình thể loại thành công.',
        data: updatedConfig
      });
    } catch (error: any) {
      console.error('updateConfig controller error:', error);
      res.status(error.message.includes('Không tìm thấy') ? 404 : 500).json({
        success: false,
        message: error.message || 'Lỗi server khi cập nhật cấu hình thể loại.'
      });
    }
  }
};
