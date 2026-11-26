import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { EstadoDocumento } from '../entities/documento-voluntario.entity';

export class ValidarDocumentoDto {
  @IsIn([EstadoDocumento.APROBADO, EstadoDocumento.OBSERVADO, EstadoDocumento.RECHAZADO])
  estado: EstadoDocumento.APROBADO | EstadoDocumento.OBSERVADO | EstadoDocumento.RECHAZADO;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  observacionesValidacion?: string;

  @IsDateString({ strict: true })
  @IsOptional()
  enviadoRevisionEn?: string;
}
