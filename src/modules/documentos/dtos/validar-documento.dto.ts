import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EstadoDocumento } from '../entities/documento-voluntario.entity';

export class ValidarDocumentoDto {
  @IsEnum(EstadoDocumento)
  @IsNotEmpty()
  estado: EstadoDocumento;

  @IsString()
  @IsOptional()
  observacionesValidacion?: string;
}
