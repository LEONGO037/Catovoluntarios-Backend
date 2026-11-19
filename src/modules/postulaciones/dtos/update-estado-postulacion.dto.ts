import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoPostulacion } from '../entities/postulacion.entity';

export class UpdateEstadoPostulacionDto {
  @IsEnum(EstadoPostulacion, {
    message: 'El estado debe ser PENDIENTE, APTO_ENTREVISTA, OBSERVADO_SOBRECARGA o DESCARTADO',
  })
  estado: EstadoPostulacion;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
