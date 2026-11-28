import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateInstitucionDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  direccion_exacta: string;

  @IsString()
  @IsNotEmpty()
  macrodistrito_zona: string;

  @IsString()
  @IsNotEmpty()
  nombre_supervisor_centro: string;

  @IsString()
  @IsNotEmpty()
  telefono_contacto: string;

  @IsOptional()
  @IsEmail()
  correo?: string | null;

  @IsOptional()
  @IsDateString()
  fecha_inicio_convenio?: string | null;

  @IsOptional()
  @IsDateString()
  fecha_fin_convenio?: string | null;
}
