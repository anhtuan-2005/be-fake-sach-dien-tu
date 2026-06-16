import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

/**
 * DTO khi tạo mới một cấu hình TypeConfig
 */
export class CreateTypeConfigDto {
  @IsString({ message: 'Type phải là một chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Type không được để trống.' })
  type!: string;

  @IsString({ message: 'OptionType phải là một chuỗi ký tự.' })
  @IsNotEmpty({ message: 'OptionType không được để trống.' })
  option_type!: string;
}

/**
 * DTO khi cập nhật cấu hình TypeConfig
 */
export class UpdateTypeConfigDto {
  @IsString({ message: 'Type phải là một chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Type không được để trống.' })
  @IsOptional()
  type?: string;

  @IsString({ message: 'OptionType phải là một chuỗi ký tự.' })
  @IsNotEmpty({ message: 'OptionType không được để trống.' })
  @IsOptional()
  option_type?: string;

  @IsString({ message: 'Status phải là một chuỗi ký tự.' })
  @IsNotEmpty({ message: 'Status không được để trống.' })
  @IsOptional()
  status?: string;
}
