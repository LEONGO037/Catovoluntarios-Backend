import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { TipoDocumento } from '../entities/documento-voluntario.entity';

export class UploadDocumentoDto {
  @IsEnum(TipoDocumento)
  @IsNotEmpty()
  tipoDocumento: TipoDocumento;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  nombreArchivoOriginal?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  numeroPoliza?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  idPoliza?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  numeroCertificado?: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsOptional()
  vigenciaInicio?: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsOptional()
  vigenciaFin?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  asegurado?: string;
}
