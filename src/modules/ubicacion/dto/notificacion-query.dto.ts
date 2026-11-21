import { IsOptional, IsInt, IsString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class NotificacionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_usuario?: number;

  @IsOptional()
  @IsString()
  rol_destinatario?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  leido?: boolean;
}
