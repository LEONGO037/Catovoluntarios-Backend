import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsDateString,
  IsNumber,
  IsInt,
  Min,
  IsOptional,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'isFixedFareWithoutArbitraryCents', async: false })
export class IsFixedFareConstraint implements ValidatorConstraintInterface {
  validate(value: number) {
    if (typeof value !== 'number') return false;
    return Number.isInteger(value) || Number(value.toFixed(2)) === value;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} debe ser un monto fijo válido de pasaje`;
  }
}

export class CreateProyectoReceptorDto {
  @IsString()
  @IsNotEmpty()
  nombre_proyecto: string;

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

  @IsEmail()
  correo: string;

  @IsDateString()
  fecha_inicio_convenio: string;

  @IsDateString()
  fecha_fin_convenio: string;

  @IsString()
  @IsNotEmpty()
  poblacion_objetivo: string;

  @IsString()
  @IsNotEmpty()
  actividades_semestre_actual: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Validate(IsFixedFareConstraint)
  monto_pasaje_fijo: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cupo_maximo_voluntarios: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  catolider_titular_id?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  catolider_aprendiz_id?: number | null;
}
