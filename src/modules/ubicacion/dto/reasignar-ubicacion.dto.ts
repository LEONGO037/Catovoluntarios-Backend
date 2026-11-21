import {
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MotivoTraslado } from '../entities/historial-reasignacion.entity';

export class ReasignarUbicacionDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id_asignacion_origen: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id_proyecto_destino: number;

  @IsEnum(MotivoTraslado)
  motivo_traslado: MotivoTraslado;

  @IsDateString()
  @IsNotEmpty()
  fecha_efectiva: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  nuevo_horario_comprometido?: string;
}
