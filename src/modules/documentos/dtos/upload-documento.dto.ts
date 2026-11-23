import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TipoDocumento } from '../entities/documento-voluntario.entity';

export class UploadDocumentoDto {
  @IsEnum(TipoDocumento)
  @IsNotEmpty()
  tipoDocumento: TipoDocumento;

  @IsString()
  @IsOptional()
  archivoUrl?: string;

  @IsString()
  @IsOptional()
  nombreArchivoOriginal?: string;

  @IsString()
  @IsOptional()
  numeroPoliza?: string;

  @IsString()
  @IsOptional()
  idPoliza?: string;

  @IsString()
  @IsOptional()
  numeroCertificado?: string;

  @IsString()
  @IsOptional()
  vigenciaInicio?: string;

  @IsString()
  @IsOptional()
  vigenciaFin?: string;

  @IsString()
  @IsOptional()
  asegurado?: string;
}
