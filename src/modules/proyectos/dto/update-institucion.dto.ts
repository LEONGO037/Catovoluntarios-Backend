import {
  IsString,
  IsEmail,
  IsDateString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class UpdateInstitucionDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  direccion_exacta?: string;

  @IsOptional()
  @IsString()
  macrodistrito_zona?: string;

  @IsOptional()
  @IsString()
  nombre_supervisor_centro?: string;

  @IsOptional()
  @IsString()
  telefono_contacto?: string;

  @IsOptional()
  @IsEmail()
  correo?: string | null;

  @IsOptional()
  @IsDateString()
  fecha_inicio_convenio?: string | null;

  @IsOptional()
  @IsDateString()
  fecha_fin_convenio?: string | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
