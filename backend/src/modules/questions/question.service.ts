import { QuestionModel, Question } from './question.model';
import { CreateQuestionDto, UpdateQuestionDto, GetQuestionsQuery, getQuestionTypesBySkill } from './question.dto';
import db from '../../config/db';

export class QuestionService {
  /**
   * Phân nhóm khối lớp theo cấp học của Admin
   */
  private static getClassesByLevel(level: string | null | undefined): string[] {
    if (!level || level.trim() === 'N/A') {
      // Mặc định trả về toàn bộ lớp nếu không có phân cấp hoặc là N/A
      return [
        'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5',
        'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9',
        'Lớp 10', 'Lớp 11', 'Lớp 12'
      ];
    }

    const trimmedLevel = level.trim();
    if (trimmedLevel === 'Cấp 1') {
      return ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];
    } else if (trimmedLevel === 'Cấp 2') {
      return ['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'];
    } else if (trimmedLevel === 'Cấp 3') {
      return ['Lớp 10', 'Lớp 11', 'Lớp 12'];
    }

    // Nếu level là 'Toàn quyền' hoặc giá trị khác, trả về toàn bộ
    return [
      'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5',
      'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9',
      'Lớp 10', 'Lớp 11', 'Lớp 12'
    ];
  }

  /**
   * Lấy cấp độ học (level) của Admin từ DB dựa vào userId nếu trong token chưa có
   */
  private static async getAdminLevel(userId: number, levelFromToken?: string | null): Promise<string | null> {
    if (levelFromToken !== undefined && levelFromToken !== null) {
      return levelFromToken;
    }
    
    // Nếu token chưa có level, thực hiện truy vấn DB
    try {
      const [rows]: any = await db.query('SELECT level FROM users WHERE id = ?', [userId]);
      return rows[0]?.level || null;
    } catch (error) {
      console.error('Error fetching admin level from DB:', error);
      return null;
    }
  }

  /**
   * API Lấy danh sách khối lớp được phép truy cập dựa trên tài khoản đang đăng nhập
   */
  static async getBlockClassesForAdmin(userId: number, levelFromToken?: string | null): Promise<string[]> {
    const level = await this.getAdminLevel(userId, levelFromToken);
    return this.getClassesByLevel(level);
  }

  /**
   * Lấy danh sách câu hỏi phân trang cứng (10 dòng/trang) và lọc dữ liệu
   */
  static async getQuestions(
    userId: number,
    levelFromToken: string | null | undefined,
    query: GetQuestionsQuery
  ): Promise<{ questions: Question[]; pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number } }> {
    // 1. Phân trang
    const currentPage = parseInt(query.page || '1', 10) || 1;
    const itemsPerPage = parseInt(query.pageSize || '10', 10) || 10;
    const offset = (currentPage - 1) * itemsPerPage;

    // 2. Xác định các bộ lọc
    const filters: any = {};
    if (query.unit) filters.unit = query.unit;
    if (query.skill) filters.skill = query.skill;
    if (query.question_type) filters.question_type = query.question_type;
    if (query.cognitive_level) filters.cognitive_level = query.cognitive_level;
    if (query.keyword) filters.keyword = query.keyword;
    if (query.id) filters.id = query.id;

    // 3. Xử lý phân quyền Khối lớp theo cấp học của Admin
    const adminLevel = await this.getAdminLevel(userId, levelFromToken);
    const allowedClasses = this.getClassesByLevel(adminLevel);

    if (query.block_class) {
      // Nếu có truyền filter block_class từ client, kiểm tra xem có được phép không
      if (allowedClasses.includes(query.block_class)) {
        filters.block_class = query.block_class;
      } else {
        // Nếu chọn lớp ngoài quyền truy cập, ép điều kiện không tìm thấy gì (gán một lớp không tồn tại hoặc ép mảng rỗng)
        filters.block_class = 'NONE_ALLOWED_CLASS';
      }
    } else {
      // Nếu không truyền block_class cụ thể, mà Admin bị giới hạn cấp học
      // Chúng ta sẽ lấy toàn bộ lớp thuộc cấp học đó. 
      // Do Model hiện tại đang dùng SQL `=` cho block_class, nếu muốn lọc theo danh sách lớp ta có thể 
      // truyền vào Model để xử lý IN (allowedClasses), hoặc nếu Model chỉ hỗ trợ single equal, 
      // chúng ta có thể truyền allowedClasses để Model xây dựng IN (lớp 1, lớp 2...)
      // Để đơn giản và tương thích với model.ts, ta cập nhật thêm logic IN trong Model hoặc 
      // xử lý trong Service. Ở đây, chúng ta sẽ gán filters.allowed_classes = allowedClasses 
      // và cập nhật Model để hỗ trợ điều kiện lọc IN nếu block_class là danh sách.
      // Tuy nhiên, để SQL thuần và đơn giản, nếu allowedClasses không bao phủ toàn bộ 12 lớp, 
      // ta gán allowed_classes vào filters.
      if (adminLevel && ['Cấp 1', 'Cấp 2', 'Cấp 3'].includes(adminLevel.trim())) {
        filters.allowed_classes = allowedClasses;
      }
    }

    // Gọi Model lấy dữ liệu và đếm tổng số dòng
    // Chúng ta cần cập nhật Model một chút hoặc xử lý gán điều kiện trong model.
    // Hãy kiểm tra xem model có hỗ trợ allowed_classes chưa. Chúng ta sẽ chỉnh sửa model sau nếu cần, 
    // hoặc xử lý điều kiện này trực tiếp. Ở đây để model không bị phức tạp, ta sẽ truyền filters vào.
    // Hãy sửa lại buildFilterQuery trong model để nó hỗ trợ filters.allowed_classes (IN (...))
    const questions = await QuestionModel.findAll(filters, itemsPerPage, offset);
    const totalItems = await QuestionModel.countAll(filters);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
      questions,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage
      }
    };
  }

  /**
   * Tạo câu hỏi
   */
  static async createQuestion(data: CreateQuestionDto, userLevel?: string): Promise<Question> {
    // 1. Bóc tách số lớp từ block_class (Ví dụ: "Lớp 10" -> 10)
    const gradeMatch = data.block_class.match(/\d+/);
    const gradeNumber = gradeMatch ? parseInt(gradeMatch[0], 10) : 0;

    // 2. Thực hiện kiểm tra bảo mật (Validation Guard)
    if (userLevel && userLevel !== 'N/A') {
      const trimmedLevel = userLevel.trim();
      let isAllowed = true;
      let rangeMessage = '';

      if (trimmedLevel === 'Cấp 1') {
        if (gradeNumber < 1 || gradeNumber > 5) {
          isAllowed = false;
          rangeMessage = 'từ Lớp 1 đến Lớp 5';
        }
      } else if (trimmedLevel === 'Cấp 2') {
        if (gradeNumber < 6 || gradeNumber > 9) {
          isAllowed = false;
          rangeMessage = 'từ Lớp 6 đến Lớp 9';
        }
      } else if (trimmedLevel === 'Cấp 3') {
        if (gradeNumber < 10 || gradeNumber > 12) {
          isAllowed = false;
          rangeMessage = 'từ Lớp 10 đến Lớp 12';
        }
      }

      if (!isAllowed) {
        const error: any = new Error(`Tài khoản của bạn chỉ có quyền tạo câu hỏi cho khối lớp ${rangeMessage}.`);
        error.status = 403;
        throw error;
      }
    }

    const questionId = await QuestionModel.create(data);
    const question = await QuestionModel.findById(questionId);
    if (!question) {
      throw new Error('Lỗi tạo câu hỏi mới.');
    }
    return question;
  }

  /**
   * Cập nhật câu hỏi
   */
  static async updateQuestion(id: number, data: UpdateQuestionDto, userLevel?: string): Promise<Question> {
    const exists = await QuestionModel.findById(id);
    if (!exists) {
      throw new Error('Không tìm thấy câu hỏi để cập nhật.');
    }

    // 1. Kiểm tra bảo mật nếu có thay đổi block_class
    if (data.block_class && userLevel && userLevel !== 'N/A') {
      const gradeMatch = data.block_class.match(/\d+/);
      const gradeNumber = gradeMatch ? parseInt(gradeMatch[0], 10) : 0;
      const trimmedLevel = userLevel.trim();
      let isAllowed = true;
      let rangeMessage = '';

      if (trimmedLevel === 'Cấp 1') {
        if (gradeNumber < 1 || gradeNumber > 5) {
          isAllowed = false;
          rangeMessage = 'từ Lớp 1 đến Lớp 5';
        }
      } else if (trimmedLevel === 'Cấp 2') {
        if (gradeNumber < 6 || gradeNumber > 9) {
          isAllowed = false;
          rangeMessage = 'từ Lớp 6 đến Lớp 9';
        }
      } else if (trimmedLevel === 'Cấp 3') {
        if (gradeNumber < 10 || gradeNumber > 12) {
          isAllowed = false;
          rangeMessage = 'từ Lớp 10 đến Lớp 12';
        }
      }

      if (!isAllowed) {
        const error: any = new Error(`Tài khoản của bạn chỉ có quyền quản lý khối lớp ${rangeMessage}.`);
        error.status = 403;
        throw error;
      }
    }

    // 2. Validate mối quan hệ giữa skill và question_type sau khi merge dữ liệu cũ
    const finalSkill = data.skill !== undefined ? data.skill : exists.skill;
    const finalQuestionType = data.question_type !== undefined ? data.question_type : exists.question_type;

    const allowedTypes = getQuestionTypesBySkill(finalSkill);
    if (!allowedTypes.includes(finalQuestionType)) {
      const error: any = new Error(`Dạng câu hỏi "${finalQuestionType}" không hợp lệ đối với kỹ năng "${finalSkill}". Các dạng câu hỏi hợp lệ là: ${allowedTypes.join(', ')}`);
      error.status = 400;
      throw error;
    }

    const success = await QuestionModel.update(id, data);
    if (!success) {
      // Trả về dữ liệu cũ nếu không có thay đổi (affectedRows = 0)
      return exists;
    }

    const updated = await QuestionModel.findById(id);
    if (!updated) {
      throw new Error('Không tìm thấy câu hỏi sau khi cập nhật.');
    }
    return updated;
  }

  /**
   * Xóa câu hỏi
   */
  static async deleteQuestion(id: number): Promise<boolean> {
    const exists = await QuestionModel.findById(id);
    if (!exists) {
      throw new Error('Không tìm thấy câu hỏi để xóa.');
    }
    return await QuestionModel.delete(id);
  }

  /**
   * Xóa hàng loạt câu hỏi
   */
  static async bulkDeleteQuestions(questionIds: number[]): Promise<number> {
    if (!questionIds || questionIds.length === 0) {
      throw new Error('Danh sách ID câu hỏi không được để trống.');
    }
    return await QuestionModel.bulkDelete(questionIds);
  }


  /**
   * Chi tiết câu hỏi
   */
  static async getQuestionById(id: number): Promise<Question> {
    const question = await QuestionModel.findById(id);
    if (!question) {
      throw new Error('Không tìm thấy câu hỏi.');
    }
    return question;
  }
}
