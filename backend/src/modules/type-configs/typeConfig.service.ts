import { TypeConfigModel, TypeConfig } from './typeConfig.model';
import { CreateTypeConfigDto, UpdateTypeConfigDto } from './typeConfig.dto';

export class TypeConfigService {
  /**
   * Nghiệp vụ lấy danh sách tất cả cấu hình thể loại
   */
  static async getAllConfigs(): Promise<TypeConfig[]> {
    return await TypeConfigModel.findAll();
  }

  /**
   * Nghiệp vụ lấy chi tiết một cấu hình theo ID
   */
  static async getConfigById(id: number): Promise<TypeConfig | null> {
    return await TypeConfigModel.findById(id);
  }

  /**
   * Nghiệp vụ tạo mới cấu hình thể loại
   */
  static async createConfig(data: CreateTypeConfigDto): Promise<TypeConfig> {
    const insertId = await TypeConfigModel.create(data);
    const createdConfig = await TypeConfigModel.findById(insertId);
    if (!createdConfig) {
      throw new Error('Lỗi tạo cấu hình thể loại mới.');
    }
    return createdConfig;
  }

  /**
   * Nghiệp vụ cập nhật cấu hình thể loại theo ID
   */
  static async updateConfig(id: number, data: UpdateTypeConfigDto): Promise<TypeConfig> {
    const exists = await TypeConfigModel.findById(id);
    if (!exists) {
      throw new Error('Không tìm thấy cấu hình thể loại để cập nhật.');
    }

    const success = await TypeConfigModel.update(id, data);
    if (!success) {
      // Trả về dữ liệu cũ nếu không có thay đổi (affectedRows = 0)
      return exists;
    }

    const updated = await TypeConfigModel.findById(id);
    if (!updated) {
      throw new Error('Lỗi tìm cấu hình sau khi cập nhật.');
    }
    return updated;
  }
}
