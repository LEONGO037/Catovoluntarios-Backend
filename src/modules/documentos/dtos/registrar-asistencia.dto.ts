import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { EstadoInduccion } from '../entities/asistencia-induccion.entity';

export class RegistrarAsistenciaInduccionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  asistenciaId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sesionId?: number;

  @IsBoolean()
  @IsOptional()
  asistio?: boolean;

  @IsDateString({ strict: true })
  @IsOptional()
  fechaCharla?: string | null;

  @IsDateString({ strict: true })
  @IsOptional()
  recorridoSitio?: string | null;

  @IsEnum(EstadoInduccion)
  @IsOptional()
  estadoInduccion?: EstadoInduccion;

  @IsString()
  @IsOptional()
  observaciones?: string | null;
}
