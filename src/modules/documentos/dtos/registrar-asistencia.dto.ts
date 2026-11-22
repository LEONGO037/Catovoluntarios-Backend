import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoInduccion } from '../entities/asistencia-induccion.entity';

export class RegistrarAsistenciaInduccionDto {
  @IsOptional()
  asistenciaId?: number;

  @IsOptional()
  userId?: number;

  @IsOptional()
  sesionId?: number;

  @IsBoolean()
  @IsOptional()
  asistio?: boolean;

  @IsString()
  @IsOptional()
  fechaCharla?: string;

  @IsString()
  @IsOptional()
  recorridoSitio?: string;

  @IsEnum(EstadoInduccion)
  @IsOptional()
  estadoInduccion?: EstadoInduccion;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
