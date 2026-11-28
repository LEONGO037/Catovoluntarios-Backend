import {
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  ValidateIf,
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

  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const motivoMap: Record<string, MotivoTraslado> = {
        'Cruce con materias universitarias': MotivoTraslado.CRUCE_MATERIAS,
        'Dificultad de transporte/distancia':
          MotivoTraslado.DIFICULTAD_TRANSPORTE,
        'Solicitud de supervisor del centro':
          MotivoTraslado.SOLICITUD_SUPERVISOR,
        'Incompatibilidad de perfil': MotivoTraslado.INCOMPATIBILIDAD_PERFIL,
        'Otro justificado': MotivoTraslado.OTRO_JUSTIFICADO,
        Otro: MotivoTraslado.OTRO,
        OTRO: MotivoTraslado.OTRO,
      };
      if (motivoMap[trimmed]) return motivoMap[trimmed];
      return trimmed;
    }
    return value;
  })
  @IsEnum(MotivoTraslado)
  motivo_traslado: MotivoTraslado;

  @ValidateIf(
    (o: ReasignarUbicacionDto) => o.motivo_traslado === MotivoTraslado.OTRO,
  )
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({
    message:
      'Debe especificar el detalle en motivo_otro_detalle cuando el motivo de traslado es Otro',
  })
  motivo_otro_detalle?: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_efectiva: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  nuevo_horario_comprometido?: string;

  @IsOptional()
  @IsString()
  semestre?: string;

  @IsOptional()
  @IsString()
  gestion?: string;
}
