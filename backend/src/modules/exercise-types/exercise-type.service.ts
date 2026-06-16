import { ExerciseTypeModel, ExerciseType, ExerciseTypeTree } from './exercise-type.model';
import { CreateExerciseTypeDto, UpdateExerciseTypeDto } from './exercise-type.dto';

export class ExerciseTypeService {
  /**
   * Helper đệ quy chuyển danh sách phẳng thành cấu trúc cây dựa trên parent_id
   */
  private static buildTree(flatList: ExerciseType[]): ExerciseTypeTree[] {
    const map = new Map<number, ExerciseTypeTree>();
    const roots: ExerciseTypeTree[] = [];

    // Đưa tất cả các phần tử vào Map với mảng children trống
    flatList.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    // Thiết lập mối quan hệ cha-con
    flatList.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parent_id === null || item.parent_id === undefined) {
        roots.push(node);
      } else {
        const parent = map.get(item.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          // Trường hợp phòng ngừa nếu không tìm thấy cha -> đẩy lên làm gốc
          roots.push(node);
        }
      }
    });

    // Dọn dẹp thuộc tính children rỗng để tối ưu hóa hiển thị trên Ant Design
    const cleanupChildren = (nodes: ExerciseTypeTree[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length === 0) {
          delete node.children;
        } else if (node.children) {
          cleanupChildren(node.children);
        }
      });
    };
    cleanupChildren(roots);

    return roots;
  }

  /**
   * Lấy toàn bộ danh sách loại bài tập và build thành cấu trúc cây
   */
  static async findAll(): Promise<ExerciseTypeTree[]> {
    const flatList = await ExerciseTypeModel.findAll();
    return this.buildTree(flatList);
  }

  /**
   * Tìm chi tiết một loại bài tập bằng ID
   */
  static async findOne(id: number): Promise<ExerciseType> {
    const record = await ExerciseTypeModel.findById(id);
    if (!record) {
      const error: any = new Error('Không tìm thấy loại bài tập.');
      error.status = 404;
      throw error;
    }
    return record;
  }

  /**
   * Tạo mới một loại bài tập kèm theo validation logic
   */
  static async create(dto: CreateExerciseTypeDto): Promise<ExerciseType> {
    // 1. Kiểm tra duy nhất cho trường code
    const existingCode = await ExerciseTypeModel.findByCode(dto.code);
    if (existingCode) {
      const error: any = new Error('Mã loại bài tập đã tồn tại trong hệ thống.');
      error.status = 400;
      throw error;
    }

    // 2. Validate thư mục cha (nếu có)
    if (dto.parent_id) {
      const parent = await ExerciseTypeModel.findById(dto.parent_id);
      if (!parent) {
        const error: any = new Error('Thư mục cha không tồn tại.');
        error.status = 400;
        throw error;
      }
      
      // Nếu có cha, bắt buộc phải chọn answer_type_code và skill
      if (!dto.answer_type_code || !dto.skill) {
        const error: any = new Error('Loại bài tập con phải có mã kiểu đáp án và kỹ năng.');
        error.status = 400;
        throw error;
      }
    } else {
      // Nếu là thư mục gốc, reset answer_type_code và skill về null để đảm bảo toàn vẹn DB
      dto.answer_type_code = null;
      dto.skill = null;
    }

    const insertedId = await ExerciseTypeModel.create(dto);
    const newRecord = await ExerciseTypeModel.findById(insertedId);
    if (!newRecord) {
      throw new Error('Lỗi khi tải dữ liệu sau khi tạo mới.');
    }
    return newRecord;
  }

  /**
   * Cập nhật thông tin loại bài tập kèm theo validation logic
   */
  static async update(id: number, dto: UpdateExerciseTypeDto): Promise<ExerciseType> {
    // 1. Kiểm tra sự tồn tại của bản ghi
    const existing = await ExerciseTypeModel.findById(id);
    if (!existing) {
      const error: any = new Error('Không tìm thấy loại bài tập cần cập nhật.');
      error.status = 404;
      throw error;
    }

    // Không cho phép chỉnh sửa thư mục gốc
    if (existing.parent_id === null) {
      const error: any = new Error('Không thể chỉnh sửa thư mục gốc.');
      error.status = 400;
      throw error;
    }

    // 2. Kiểm tra duy nhất cho code (nếu có thay đổi)
    if (dto.code && dto.code !== existing.code) {
      const duplicate = await ExerciseTypeModel.findByCode(dto.code, id);
      if (duplicate) {
        const error: any = new Error('Mã loại bài tập đã tồn tại trong hệ thống.');
        error.status = 400;
        throw error;
      }
    }

    // 3. Xử lý logic parent_id và các ràng buộc đi kèm
    const targetParentId = dto.parent_id !== undefined ? dto.parent_id : existing.parent_id;

    if (targetParentId) {
      // Tránh việc tự nhận chính mình làm cha
      if (targetParentId === id) {
        const error: any = new Error('Loại bài tập không thể chọn chính nó làm thư mục cha.');
        error.status = 400;
        throw error;
      }

      const parent = await ExerciseTypeModel.findById(targetParentId);
      if (!parent) {
        const error: any = new Error('Thư mục cha không tồn tại.');
        error.status = 400;
        throw error;
      }

      // Ràng buộc đối với nút con
      const finalAnswerTypeCode = dto.answer_type_code !== undefined ? dto.answer_type_code : existing.answer_type_code;
      const finalSkill = dto.skill !== undefined ? dto.skill : existing.skill;

      if (!finalAnswerTypeCode || !finalSkill) {
        const error: any = new Error('Loại bài tập con phải có mã kiểu đáp án và kỹ năng.');
        error.status = 400;
        throw error;
      }
    } else {
      // Nếu chuyển về thư mục gốc, bắt buộc reset các trường con về null
      dto.answer_type_code = null;
      dto.skill = null;
    }

    await ExerciseTypeModel.update(id, dto);
    const updatedRecord = await ExerciseTypeModel.findById(id);
    if (!updatedRecord) {
      throw new Error('Lỗi khi tải dữ liệu sau khi cập nhật.');
    }
    return updatedRecord;
  }

  /**
   * Xóa một loại bài tập và kiểm tra ràng buộc nút cha
   */
  static async remove(id: number): Promise<boolean> {
    // 1. Kiểm tra xem loại bài tập có tồn tại không
    const record = await ExerciseTypeModel.findById(id);
    if (!record) {
      const error: any = new Error('Không tìm thấy loại bài tập để xóa.');
      error.status = 404;
      throw error;
    }

    // Không cho phép xóa thư mục gốc
    if (record.parent_id === null) {
      const error: any = new Error('Không thể xóa thư mục gốc.');
      error.status = 400;
      throw error;
    }

    // 2. Ràng buộc: kiểm tra xem có chứa loại bài tập con nào không
    const hasChildren = await ExerciseTypeModel.hasChildren(id);
    if (hasChildren) {
      const error: any = new Error('Không thể xóa: Thư mục này đang chứa các loại bài tập con. Vui lòng xóa hoặc di chuyển chúng trước.');
      error.status = 400;
      throw error;
    }

    return await ExerciseTypeModel.delete(id);
  }
}
