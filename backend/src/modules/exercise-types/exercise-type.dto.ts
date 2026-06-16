import { IsNotEmpty, IsEnum, IsInt, IsOptional, IsString, ValidateIf } from 'class-validator';

/**
 * DTO khi tạo mới một loại bài tập
 */
export class CreateExerciseTypeDto {
  @IsNotEmpty({ message: 'Cấp học không được để trống.' })
  @IsEnum(['Tieu hoc', 'THCS', 'THPT'], { message: 'Cấp học phải là Tieu hoc, THCS hoặc THPT.' })
  school_level!: 'Tieu hoc' | 'THCS' | 'THPT';

  @IsOptional()
  @IsInt({ message: 'ID thư mục cha phải là số nguyên.' })
  parent_id?: number | null;

  @IsNotEmpty({ message: 'Tên loại bài tập không được để trống.' })
  @IsString({ message: 'Tên loại bài tập phải là chuỗi ký tự.' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'Tiêu đề tiếng Việt phải là chuỗi ký tự.' })
  vietnamese_title?: string | null;

  @IsNotEmpty({ message: 'Mã loại bài tập không được để trống.' })
  @IsString({ message: 'Mã loại bài tập phải là chuỗi ký tự.' })
  code!: string;

  // Nếu parent_id có giá trị thực (không phải null/undefined), answer_type_code là bắt buộc
  @ValidateIf((o) => o.parent_id !== undefined && o.parent_id !== null)
  @IsNotEmpty({ message: 'Mã kiểu đáp án là bắt buộc đối với loại bài tập con.' })
  @IsEnum(['single', 'multiple'], { message: 'Mã kiểu đáp án phải là single hoặc multiple.' })
  answer_type_code?: 'single' | 'multiple' | null;

  // Nếu parent_id có giá trị thực (không phải null/undefined), skill là bắt buộc
  @ValidateIf((o) => o.parent_id !== undefined && o.parent_id !== null)
  @IsNotEmpty({ message: 'Kỹ năng là bắt buộc đối với loại bài tập con.' })
  @IsString({ message: 'Kỹ năng phải là chuỗi ký tự.' })
  skill?: string | null;
}

/**
 * DTO khi cập nhật thông tin loại bài tập
 */
export class UpdateExerciseTypeDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Cấp học không được để trống.' })
  @IsEnum(['Tieu hoc', 'THCS', 'THPT'], { message: 'Cấp học phải là Tieu hoc, THCS hoặc THPT.' })
  school_level?: 'Tieu hoc' | 'THCS' | 'THPT';

  @IsOptional()
  @IsInt({ message: 'ID thư mục cha phải là số nguyên.' })
  parent_id?: number | null;

  @IsOptional()
  @IsNotEmpty({ message: 'Tên loại bài tập không được để trống.' })
  @IsString({ message: 'Tên loại bài tập phải là chuỗi ký tự.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Tiêu đề tiếng Việt phải là chuỗi ký tự.' })
  vietnamese_title?: string | null;

  @IsOptional()
  @IsNotEmpty({ message: 'Mã loại bài tập không được để trống.' })
  @IsString({ message: 'Mã loại bài tập phải là chuỗi ký tự.' })
  code?: string;

  // Nếu parent_id có giá trị thực (không phải null/undefined), answer_type_code là bắt buộc
  @ValidateIf((o) => o.parent_id !== undefined && o.parent_id !== null)
  @IsNotEmpty({ message: 'Mã kiểu đáp án là bắt buộc đối với loại bài tập con.' })
  @IsEnum(['single', 'multiple'], { message: 'Mã kiểu đáp án phải là single hoặc multiple.' })
  answer_type_code?: 'single' | 'multiple' | null;

  // Nếu parent_id có giá trị thực (không phải null/undefined), skill là bắt buộc
  @ValidateIf((o) => o.parent_id !== undefined && o.parent_id !== null)
  @IsNotEmpty({ message: 'Kỹ năng là bắt buộc đối với loại bài tập con.' })
  @IsString({ message: 'Kỹ năng phải là chuỗi ký tự.' })
  skill?: string | null;
}
