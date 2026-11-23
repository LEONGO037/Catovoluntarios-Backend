import {
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
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

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const motivoMap: Record<string, MotivoTraslado> = {
        'Cruce con materias universitarias': MotivoTraslado.CRUCE_MATERIAS,
        'Dificultad de transporte/distancia': MotivoTraslado.DIFICULTAD_TRANSPORTE,
        'Solicitud de supervisor del centro': MotivoTraslado.SOLICITUD_SUPERVISOR,
        'Incompatibilidad de perfil': MotivoTraslado.INCOMPATIBILIDAD_PERFIL,
        'Otro justificado': MotivoTraslado.OTRO_JUSTIFICADO,
      };
      if (motivoMap[value]) return motivoMap[value];
    }
    return value;
  })
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
