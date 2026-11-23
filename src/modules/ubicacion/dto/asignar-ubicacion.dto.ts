import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CondicionVoluntario } from '../entities/asignacion-ubicacion.entity';

export class AsignarUbicacionDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id_usuario: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id_proyecto: number;

  @IsString()
  @IsNotEmpty()
  semestre: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const v = value.toUpperCase();
      if (v.includes('ANTIGUO')) return CondicionVoluntario.ANTIGUO;
      if (v.includes('NUEVO')) return CondicionVoluntario.NUEVO;
    }
    return value;
  })
  @IsEnum(CondicionVoluntario)
  condicion: CondicionVoluntario;

  @IsString()
  @IsNotEmpty()
  horario_comprometido: string;

  @IsOptional()
  @IsBoolean()
  poliza_validada?: boolean = false;

  @IsOptional()
  @IsBoolean()
  induccion_completada?: boolean = false;
}
