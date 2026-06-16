import { IsArray, ArrayMinSize, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Interface cho đáp án câu hỏi
 */
export interface QuestionAnswer {
  text: string;
  isCorrect: boolean;
  type?: 'text' | 'image';
  image_url?: string | null;
}

/**
 * Interface cho dữ liệu tạo câu hỏi mới
 */
export interface CreateQuestionDto {
  block_class: string;
  unit: string;
  skill: string;
  question_type: string;
  requirement: string;
  content: string;
  audio_url?: string | null;
  image_url?: string | null;
  answers: QuestionAnswer[];
  cognitive_level: string;
}

/**
 * Interface cho dữ liệu cập nhật câu hỏi
 */
export interface UpdateQuestionDto {
  block_class?: string;
  unit?: string;
  skill?: string;
  question_type?: string;
  requirement?: string;
  content?: string;
  audio_url?: string | null;
  image_url?: string | null;
  answers?: QuestionAnswer[];
  cognitive_level?: string;
}

/**
 * Interface cho các tham số lọc khi lấy danh sách câu hỏi
 */
export interface GetQuestionsQuery {
  page?: string;
  pageSize?: string;
  block_class?: string;
  unit?: string;
  skill?: string;
  question_type?: string;
  cognitive_level?: string;
  keyword?: string; // tìm trong content
  id?: string;       // tìm theo id cụ thể
}

/**
 * Hàm validate dữ liệu tạo câu hỏi
 * Trả về danh sách lỗi nếu có, hoặc null nếu hợp lệ
 */
export function validateCreateQuestion(dto: CreateQuestionDto): string[] | null {
  const errors: string[] = [];

  if (!dto.block_class || typeof dto.block_class !== 'string' || dto.block_class.trim() === '') {
    errors.push('Khối lớp không được để trống và phải là chuỗi ký tự.');
  }
  if (!dto.unit || typeof dto.unit !== 'string' || dto.unit.trim() === '') {
    errors.push('Unit không được để trống và phải là chuỗi ký tự.');
  }
  if (!dto.skill || typeof dto.skill !== 'string' || dto.skill.trim() === '') {
    errors.push('Kỹ năng không được để trống và phải là chuỗi ký tự.');
  }
  if (!dto.question_type || typeof dto.question_type !== 'string' || dto.question_type.trim() === '') {
    errors.push('Dạng câu hỏi không được để trống và phải là chuỗi ký tự.');
  }
  if (!dto.requirement || typeof dto.requirement !== 'string' || dto.requirement.trim() === '') {
    errors.push('Yêu cầu đề bài không được để trống.');
  }
  if (!dto.content || typeof dto.content !== 'string' || dto.content.trim() === '') {
    errors.push('Nội dung câu hỏi không được để trống.');
  }

  if (dto.audio_url !== undefined && dto.audio_url !== null && typeof dto.audio_url !== 'string') {
    errors.push('Đường dẫn âm thanh (audio_url) phải là chuỗi ký tự.');
  }
  if (dto.image_url !== undefined && dto.image_url !== null && typeof dto.image_url !== 'string') {
    errors.push('Đường dẫn hình ảnh (image_url) phải là chuỗi ký tự.');
  }

  // --- VALIDATE MẢNG ĐÁP ÁN (Dạng Array of Objects) ---
  if (!dto.answers || !Array.isArray(dto.answers)) {
    errors.push('Trường đáp án (answers) phải là một mảng (Array).');
  } else {
    const minAnswers = dto.question_type === 'Word form' ? 1 : 2;
    if (dto.answers.length < minAnswers) {
      errors.push(dto.question_type === 'Word form' ? 'Phải cung cấp đáp án cho câu hỏi.' : 'Phải cung cấp ít nhất 2 đáp án lựa chọn.');
    } else {
      // Validate cấu trúc từng object trong mảng
      dto.answers.forEach((ans, index) => {
        if (!ans || typeof ans !== 'object') {
          errors.push(`Đáp án thứ ${index + 1} phải là một đối tượng (Object).`);
          return;
        }
        
        const ansType = ans.type || 'text';
        if (ansType === 'text') {
          if (typeof ans.text !== 'string' || ans.text.trim() === '') {
            errors.push(`Nội dung (text) của đáp án thứ ${index + 1} phải là chuỗi ký tự và không được để trống.`);
          }
        } else if (ansType === 'image') {
          if (typeof ans.image_url !== 'string' || ans.image_url.trim() === '') {
            errors.push(`Hình ảnh (image_url) của đáp án thứ ${index + 1} không được để trống.`);
          }
        } else {
          errors.push(`Loại đáp án thứ ${index + 1} không hợp lệ (chỉ chấp nhận 'text' hoặc 'image').`);
        }
        
        if (typeof ans.isCorrect !== 'boolean') {
          errors.push(`Trạng thái đúng/sai (isCorrect) của đáp án thứ ${index + 1} phải là kiểu boolean.`);
        }
      });

      // Kiểm tra xem có ít nhất 1 đáp án đúng không
      if (!dto.answers.some(ans => ans.isCorrect === true)) {
        errors.push('Phải có ít nhất một đáp án được đánh dấu là đúng (isCorrect: true).');
      }
    }
  }

  if (!dto.cognitive_level || typeof dto.cognitive_level !== 'string' || dto.cognitive_level.trim() === '') {
    errors.push('Mức độ nhận thức không được để trống.');
  }

  const validSkills = ['Vocabulary & Structures', 'Writing', 'Reading', 'Speaking', 'Phonetics'];
  if (dto.skill && !validSkills.includes(dto.skill)) {
    errors.push(`Kỹ năng không hợp lệ. Phải thuộc: ${validSkills.join(', ')}`);
  }

  const validQuestionTypes = ['Cloze', 'Dictionary Entry', 'Multiple choice', 'Reading comprehension', 'Sign', 'Transformation', 'Word form', 'FillInTheBlank'];
  if (dto.question_type && !validQuestionTypes.includes(dto.question_type)) {
    errors.push(`Dạng câu hỏi không hợp lệ. Phải thuộc: ${validQuestionTypes.join(', ')}`);
  }

  // Validate mối quan hệ hợp lệ giữa kỹ năng và dạng câu hỏi
  if (dto.skill && dto.question_type && validSkills.includes(dto.skill)) {
    const allowedTypes = getQuestionTypesBySkill(dto.skill);
    if (!allowedTypes.includes(dto.question_type)) {
      errors.push(`Dạng câu hỏi "${dto.question_type}" không hợp lệ đối với kỹ năng "${dto.skill}". Nhóm dạng câu hỏi hợp lệ là: ${allowedTypes.join(', ')}`);
    }
  }

  const validCognitiveLevels = ['Nhận biết', 'Thông hiểu', 'Vận dụng'];
  if (dto.cognitive_level && !validCognitiveLevels.includes(dto.cognitive_level)) {
    errors.push(`Mức độ nhận thức không hợp lệ. Phải thuộc: ${validCognitiveLevels.join(', ')}`);
  }

  return errors.length > 0 ? errors : null;
}

/**
 * Hàm validate dữ liệu cập nhật câu hỏi
 */
export function validateUpdateQuestion(dto: UpdateQuestionDto, currentQuestionType?: string): string[] | null {
  const errors: string[] = [];

  if (dto.block_class !== undefined && (typeof dto.block_class !== 'string' || dto.block_class.trim() === '')) {
    errors.push('Khối lớp phải là chuỗi ký tự hợp lệ.');
  }
  if (dto.unit !== undefined && (typeof dto.unit !== 'string' || dto.unit.trim() === '')) {
    errors.push('Unit phải là chuỗi ký tự hợp lệ.');
  }
  if (dto.skill !== undefined) {
    const validSkills = ['Vocabulary & Structures', 'Writing', 'Reading', 'Speaking', 'Phonetics'];
    if (!validSkills.includes(dto.skill)) {
      errors.push(`Kỹ năng không hợp lệ. Phải thuộc: ${validSkills.join(', ')}`);
    }
  }
  if (dto.question_type !== undefined) {
    const validQuestionTypes = ['Cloze', 'Dictionary Entry', 'Multiple choice', 'Reading comprehension', 'Sign', 'Transformation', 'Word form', 'FillInTheBlank'];
    if (!validQuestionTypes.includes(dto.question_type)) {
      errors.push(`Dạng câu hỏi không hợp lệ. Phải thuộc: ${validQuestionTypes.join(', ')}`);
    }
  }

  // Validate mối quan hệ giữa kỹ năng và dạng câu hỏi khi cập nhật (nếu cả 2 cùng được truyền lên)
  if (dto.skill !== undefined && dto.question_type !== undefined) {
    const allowedTypes = getQuestionTypesBySkill(dto.skill);
    if (!allowedTypes.includes(dto.question_type)) {
      errors.push(`Dạng câu hỏi "${dto.question_type}" không hợp lệ đối với kỹ năng "${dto.skill}". Nhóm dạng câu hỏi hợp lệ là: ${allowedTypes.join(', ')}`);
    }
  }

  // --- VALIDATE MẢNG ĐÁP ÁN KHI CẬP NHẬT ---
  if (dto.answers !== undefined) {
    if (!Array.isArray(dto.answers)) {
      errors.push('Trường đáp án (answers) phải là một mảng (Array).');
    } else {
      const qType = currentQuestionType || dto.question_type;
      const minAnswers = qType === 'Word form' ? 1 : 2;
      if (dto.answers.length < minAnswers) {
        errors.push(qType === 'Word form' ? 'Phải cung cấp đáp án cho câu hỏi.' : 'Phải cung cấp ít nhất 2 đáp án lựa chọn.');
      } else {
        dto.answers.forEach((ans, index) => {
          if (!ans || typeof ans !== 'object') {
            errors.push(`Đáp án thứ ${index + 1} phải là một đối tượng (Object).`);
            return;
          }
          
          const ansType = ans.type || 'text';
          if (ansType === 'text') {
            if (typeof ans.text !== 'string' || ans.text.trim() === '') {
              errors.push(`Nội dung (text) của đáp án thứ ${index + 1} phải là chuỗi ký tự và không được để trống.`);
            }
          } else if (ansType === 'image') {
            if (typeof ans.image_url !== 'string' || ans.image_url.trim() === '') {
              errors.push(`Hình ảnh (image_url) của đáp án thứ ${index + 1} không được để trống.`);
            }
          } else {
            errors.push(`Loại đáp án thứ ${index + 1} không hợp lệ (chỉ chấp nhận 'text' hoặc 'image').`);
          }
          
          if (typeof ans.isCorrect !== 'boolean') {
            errors.push(`Trạng thái đúng/sai (isCorrect) của đáp án thứ ${index + 1} phải là kiểu boolean.`);
          }
        });

        if (!dto.answers.some(ans => ans.isCorrect === true)) {
          errors.push('Phải có ít nhất một đáp án được đánh dấu là đúng (isCorrect: true).');
        }
      }
    }
  }

  if (dto.audio_url !== undefined && dto.audio_url !== null && typeof dto.audio_url !== 'string') {
    errors.push('Đường dẫn âm thanh (audio_url) phải là chuỗi ký tự.');
  }
  if (dto.image_url !== undefined && dto.image_url !== null && typeof dto.image_url !== 'string') {
    errors.push('Đường dẫn hình ảnh (image_url) phải là chuỗi ký tự.');
  }

  if (dto.cognitive_level !== undefined) {
    const validCognitiveLevels = ['Nhận biết', 'Thông hiểu', 'Vận dụng'];
    if (!validCognitiveLevels.includes(dto.cognitive_level)) {
      errors.push(`Mức độ nhận thức không hợp lệ. Phải thuộc: ${validCognitiveLevels.join(', ')}`);
    }
  }

  return errors.length > 0 ? errors : null;
}

/**
 * DTO để xóa hàng loạt câu hỏi
 */
export class BulkDeleteQuestionsDto {
  @IsArray({ message: 'Danh sách ID câu hỏi phải là một mảng.' })
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất một câu hỏi để xóa.' })
  @IsInt({ each: true, message: 'ID câu hỏi phải là số nguyên.' })
  @Min(1, { each: true, message: 'ID câu hỏi phải là số nguyên dương.' })
  @Type(() => Number)
  questionIds!: number[];
}

/**
 * Hàm hỗ trợ lấy dạng câu hỏi hợp lệ theo kỹ năng
 */
export const getQuestionTypesBySkill = (skillName: string): string[] => {
  switch (skillName) {
    case 'Vocabulary & Structures':
      return ['Multiple choice', 'Word form'];
    case 'Writing':
      return ['Dictionary Entry', 'Transformation'];
    case 'Reading':
      return ['Cloze', 'Reading comprehension', 'Sign'];
    case 'Speaking':
      return ['Multiple choice'];
    case 'Phonetics':
      return ['Multiple choice'];
    default:
      return [];
  }
};

