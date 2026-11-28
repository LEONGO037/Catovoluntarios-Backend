import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CondicionVoluntario } from '../entities/asignacion-ubicacion.entity';

export class FilterPostulantesAdmitidosDto {
  @IsOptional()
  @IsString()
  carrera?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  edad_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  edad_max?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      const v = value.toUpperCase();
      if (v.includes('ANTIGUO')) return CondicionVoluntario.ANTIGUO;
      if (v.includes('NUEVO')) return CondicionVoluntario.NUEVO;
    }
    return value;
  })
  @IsEnum(CondicionVoluntario)
  condicion?: CondicionVoluntario;

  @IsOptional()
  @IsString()
  poblacion_sugerida?: string;

  @IsOptional()
  @IsString()
  semestre?: string;

  @IsOptional()
  @IsString()
  gestion?: string;
}
